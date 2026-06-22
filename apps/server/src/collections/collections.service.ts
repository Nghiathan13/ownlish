import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WordCollectionKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeWord } from '../vocab/lib/normalize-word';
import { OXFORD_DEFINITION_SOURCES } from './collections.constants';

type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  kind: WordCollectionKind;
  source: string | null;
  cefrLevel: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type CatalogDefinitionResult = {
  id: string;
  sourceDefinitionId: number;
  sourceWordId: number;
  type: string;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  exampleVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  band: string | null;
  source: string;
};

type CatalogWordResult = {
  id: string;
  word: string;
  normalizedWord: string;
  definitions: CatalogDefinitionResult[];
};

type CollectionDetail = CollectionSummary & {
  catalogWords: CatalogWordResult[];
  vocabWords: Awaited<ReturnType<PrismaService['vocabWord']['findMany']>>;
};

type ImportCollectionResult = {
  imported: number;
  updated: number;
  skipped: number;
};

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CollectionSummary[]> {
    const collections = await this.prisma.wordCollection.findMany({
      where: this.visibleCollectionWhere(userId),
      include: {
        _count: {
          select: {
            catalogItems: true,
            userWordItems: true,
          },
        },
      },
      orderBy: [
        {
          kind: 'asc',
        },
        {
          cefrLevel: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return collections.map((collection) => ({
      ...this.toSummary(collection),
      itemCount:
        collection._count.catalogItems + collection._count.userWordItems,
    }));
  }

  async createUserCollection(
    userId: string,
    input: { name: string; description?: string },
  ): Promise<CollectionSummary> {
    const name = input.name.trim();
    const description = input.description?.trim() || null;

    if (!name) {
      throw new BadRequestException('Collection name is required.');
    }

    const collection = await this.prisma.wordCollection.create({
      data: {
        kind: WordCollectionKind.USER,
        ownerUserId: userId,
        name,
        description,
        isPublic: false,
      },
      include: {
        _count: {
          select: {
            catalogItems: true,
            userWordItems: true,
          },
        },
      },
    });

    return {
      ...this.toSummary(collection),
      itemCount:
        collection._count.catalogItems + collection._count.userWordItems,
    };
  }

  async get(userId: string, id: string): Promise<CollectionDetail> {
    const collection = await this.findVisibleCollection(userId, id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const catalogWords =
      collection.kind === WordCollectionKind.SYSTEM
        ? await this.getCatalogWords(collection.id, collection.cefrLevel)
        : [];
    const vocabWords =
      collection.kind === WordCollectionKind.USER
        ? await this.getUserVocabWords(collection.id)
        : [];

    return {
      ...this.toSummary(collection),
      itemCount: catalogWords.length + vocabWords.length,
      catalogWords,
      vocabWords,
    };
  }

  async importToVocabulary(
    userId: string,
    id: string,
  ): Promise<ImportCollectionResult> {
    const collection = await this.findVisibleCollection(userId, id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.kind !== WordCollectionKind.SYSTEM) {
      throw new BadRequestException('Only system collections can be imported');
    }

    const catalogWords = await this.getCatalogWords(
      collection.id,
      collection.cefrLevel,
    );

    if (catalogWords.length === 0) {
      return {
        imported: 0,
        updated: 0,
        skipped: 0,
      };
    }

    const normalizedWords = catalogWords.map((catalogWord) =>
      normalizeWord(catalogWord.word),
    );
    const existingWords = await this.prisma.vocabWord.findMany({
      where: {
        userId,
        normalizedWord: {
          in: normalizedWords,
        },
      },
      select: {
        id: true,
        normalizedWord: true,
      },
    });
    const existingWordByNormalizedWord = new Map(
      existingWords.map((word) => [word.normalizedWord, word]),
    );
    const newWords = catalogWords.filter(
      (catalogWord) =>
        !existingWordByNormalizedWord.has(normalizeWord(catalogWord.word)),
    );
    const createWordsResult = await this.prisma.vocabWord.createMany({
      data: newWords.map((catalogWord) =>
        this.toImportedVocabWord(userId, catalogWord),
      ),
      skipDuplicates: true,
    });
    const allWords = await this.prisma.vocabWord.findMany({
      where: {
        userId,
        normalizedWord: {
          in: normalizedWords,
        },
      },
      select: {
        id: true,
        normalizedWord: true,
      },
    });
    const wordByNormalizedWord = new Map(
      allWords.map((word) => [word.normalizedWord, word]),
    );
    const existingDefinitionByKey = await this.getExistingDefinitionByKey(
      existingWords.map((word) => word.id),
    );
    const updatedWordIds = new Set<string>();
    const definitionsToRestore: ReturnType<typeof this.toImportedDefinition>[] =
      [];
    const definitionData = catalogWords.flatMap((catalogWord) => {
      const normalizedWord = normalizeWord(catalogWord.word);
      const vocabWord = wordByNormalizedWord.get(normalizedWord);

      if (!vocabWord) {
        return [];
      }

      return catalogWord.definitions.flatMap((definition) => {
        const key = this.getDefinitionKey(
          vocabWord.id,
          definition.source,
          definition.sourceDefinitionId,
        );
        const existingDefinition = existingDefinitionByKey.get(key);
        const importedDefinition = this.toImportedDefinition(
          vocabWord.id,
          definition,
        );

        if (existingDefinition) {
          if (existingDefinition.deletedAt) {
            definitionsToRestore.push(importedDefinition);
            updatedWordIds.add(vocabWord.id);
          }

          return [];
        }

        if (existingWordByNormalizedWord.has(normalizedWord)) {
          updatedWordIds.add(vocabWord.id);
        }

        return [importedDefinition];
      });
    });

    if (definitionsToRestore.length > 0) {
      await Promise.all(
        definitionsToRestore.map((definition) =>
          this.prisma.vocabWordDefinition.updateMany({
            where: {
              vocabWordId: definition.vocabWordId,
              source: definition.source,
              sourceDefinitionId: definition.sourceDefinitionId,
            },
            data: {
              ...this.toRestoredDefinitionData(definition),
              deletedAt: null,
            },
          }),
        ),
      );
    }

    if (definitionData.length > 0) {
      await this.prisma.vocabWordDefinition.createMany({
        data: definitionData,
        skipDuplicates: true,
      });
    }

    const imported = createWordsResult.count;
    const updated = updatedWordIds.size;

    return {
      imported,
      updated,
      skipped: Math.max(0, catalogWords.length - imported - updated),
    };
  }

  private visibleCollectionWhere(userId: string) {
    return {
      OR: [
        {
          kind: WordCollectionKind.SYSTEM,
          isPublic: true,
        },
        {
          ownerUserId: userId,
        },
      ],
    };
  }

  private findVisibleCollection(userId: string, id: string) {
    return this.prisma.wordCollection.findFirst({
      where: {
        id,
        ...this.visibleCollectionWhere(userId),
      },
    });
  }

  private async getCatalogWords(
    collectionId: string,
    cefrLevel: string | null,
  ): Promise<CatalogWordResult[]> {
    const items = await this.prisma.collectionCatalogItem.findMany({
      where: {
        collectionId,
      },
      include: {
        catalogWord: {
          include: {
            definitions: {
              where: {
                ...(cefrLevel ? { band: cefrLevel } : {}),
                source: {
                  in: OXFORD_DEFINITION_SOURCES,
                },
              },
              orderBy: [
                {
                  source: 'asc',
                },
                {
                  type: 'asc',
                },
              ],
            },
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          catalogWord: {
            word: 'asc',
          },
        },
      ],
    });

    return items.map((item) => item.catalogWord);
  }

  private getUserVocabWords(collectionId: string) {
    return this.prisma.vocabWord.findMany({
      where: {
        collectionItems: {
          some: {
            collectionId,
          },
        },
        definitions: {
          some: {
            deletedAt: null,
          },
        },
      },
      include: {
        definitions: {
          where: {
            deletedAt: null,
          },
          orderBy: [{ source: 'asc' }, { type: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: {
        word: 'asc',
      },
    });
  }

  private async getExistingDefinitionByKey(vocabWordIds: string[]) {
    if (vocabWordIds.length === 0) {
      return new Map<string, { deletedAt: Date | null }>();
    }

    const definitions = await this.prisma.vocabWordDefinition.findMany({
      where: {
        vocabWordId: {
          in: vocabWordIds,
        },
        sourceDefinitionId: {
          not: null,
        },
      },
      select: {
        vocabWordId: true,
        source: true,
        sourceDefinitionId: true,
        deletedAt: true,
      },
    });

    return new Map(
      definitions.map((definition) => [
        this.getDefinitionKey(
          definition.vocabWordId,
          definition.source,
          definition.sourceDefinitionId,
        ),
        { deletedAt: definition.deletedAt },
      ]),
    );
  }

  private getDefinitionKey(
    vocabWordId: string,
    source: string,
    sourceDefinitionId: number | null,
  ) {
    return `${vocabWordId}:${source}:${sourceDefinitionId ?? ''}`;
  }

  private toImportedVocabWord(userId: string, catalogWord: CatalogWordResult) {
    return {
      userId,
      word: catalogWord.word,
      normalizedWord: normalizeWord(catalogWord.word),
    };
  }

  private toImportedDefinition(
    vocabWordId: string,
    definition: CatalogDefinitionResult,
  ) {
    return {
      vocabWordId,
      sourceDefinitionId: definition.sourceDefinitionId,
      sourceWordId: definition.sourceWordId,
      type: definition.type,
      meaningVi: definition.meaningVi,
      definition: definition.definition,
      example: definition.example,
      exampleVi: definition.exampleVi,
      ipaUk: definition.ipaUk,
      ipaUs: definition.ipaUs,
      band: definition.band,
      source: definition.source,
    };
  }

  private toRestoredDefinitionData(
    definition: ReturnType<typeof this.toImportedDefinition>,
  ) {
    return {
      sourceWordId: definition.sourceWordId,
      type: definition.type,
      meaningVi: definition.meaningVi,
      definition: definition.definition,
      example: definition.example,
      exampleVi: definition.exampleVi,
      ipaUk: definition.ipaUk,
      ipaUs: definition.ipaUs,
      band: definition.band,
      source: definition.source,
    };
  }

  private toSummary(collection: {
    id: string;
    name: string;
    description: string | null;
    kind: WordCollectionKind;
    source: string | null;
    cefrLevel: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Omit<CollectionSummary, 'itemCount'> {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      kind: collection.kind,
      source: collection.source,
      cefrLevel: collection.cefrLevel,
      isPublic: collection.isPublic,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }
}

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
    const data = catalogWords.map((catalogWord) =>
      this.toImportedVocabWord(userId, collection.cefrLevel, catalogWord),
    );

    if (data.length === 0) {
      return {
        imported: 0,
        skipped: 0,
      };
    }

    const result = await this.prisma.vocabWord.createMany({
      data,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      skipped: data.length - result.count,
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
        deletedAt: null,
      },
      orderBy: {
        word: 'asc',
      },
    });
  }

  private toImportedVocabWord(
    userId: string,
    band: string | null,
    catalogWord: CatalogWordResult,
  ) {
    const definitions = catalogWord.definitions;
    const firstDefinition = definitions[0];

    return {
      userId,
      word: catalogWord.word,
      normalizedWord: normalizeWord(catalogWord.word),
      ipa:
        firstNonEmpty(definitions.map((definition) => definition.ipaUk)) ??
        firstNonEmpty(definitions.map((definition) => definition.ipaUs)),
      type: joinUnique(definitions.map((definition) => definition.type)),
      meaningVi: joinUnique(
        definitions.map((definition) => definition.meaningVi),
      ),
      definition: firstNonEmpty(
        definitions.map((definition) => definition.definition),
      ),
      example: firstDefinition?.example ?? null,
      band,
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

function firstNonEmpty(values: Array<string | null>) {
  return values.find((value) => value && value.trim()) ?? null;
}

function joinUnique(values: Array<string | null>) {
  const uniqueValues = Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim()))),
  );

  return uniqueValues.length ? uniqueValues.join('; ') : null;
}

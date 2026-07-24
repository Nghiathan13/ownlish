import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WordCollectionKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeWord } from '../vocab/lib/normalize-word';
import {
  OXFORD_CEFR_LEVELS,
  OXFORD_COLLECTION_SOURCE,
  OXFORD_DEFINITION_SOURCES,
} from './collections.constants';

type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  kind: WordCollectionKind;
  source: string | null;
  cefrLevel: string | null;
  isDefault: boolean;
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

type ImportedDefinitionData = {
  vocabWordId: string;
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

type CollectionDetail = CollectionSummary & {
  catalogWords: CatalogWordResult[];
  vocabWords: Awaited<ReturnType<PrismaService['vocabWord']['findMany']>>;
};

type CatalogWordsPage = {
  items: CatalogWordResult[];
  total: number;
  offset: number;
  limit: number;
};

type OxfordCollectionMeta = {
  band: string;
  itemCount: number;
};

type OxfordPart = {
  items: CatalogWordResult[];
  limit: number;
  offset: number;
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
            vocabWords: true,
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

    const systemCounts = await this.prisma.systemVocabularyEntry.groupBy({
      by: ['band'],
      where: { source: { in: OXFORD_DEFINITION_SOURCES } },
      _count: { _all: true },
    });
    const systemCountByBand = new Map(
      systemCounts.map((count) => [count.band, count._count._all]),
    );

    return collections.map((collection) => ({
      ...this.toSummary(collection),
      itemCount:
        collection.kind === WordCollectionKind.SYSTEM
          ? (systemCountByBand.get(collection.cefrLevel ?? '') ?? 0)
          : collection._count.vocabWords,
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
        isDefault: false,
        isPublic: false,
      },
      include: {
        _count: {
          select: {
            vocabWords: true,
          },
        },
      },
    });

    return {
      ...this.toSummary(collection),
      itemCount: collection._count.vocabWords,
    };
  }

  async updateUserCollection(
    userId: string,
    id: string,
    input: { name: string; description?: string },
  ): Promise<CollectionSummary> {
    const collection = await this.prisma.wordCollection.findFirst({
      where: {
        id,
        ownerUserId: userId,
        kind: WordCollectionKind.USER,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const name = input.name.trim();
    const description = input.description?.trim() || null;

    if (!name) {
      throw new BadRequestException('Collection name is required.');
    }

    const updatedCollection = await this.prisma.wordCollection.update({
      where: { id },
      data: {
        name,
        description,
      },
      include: {
        _count: {
          select: {
            vocabWords: true,
          },
        },
      },
    });

    return {
      ...this.toSummary(updatedCollection),
      itemCount: updatedCollection._count.vocabWords,
    };
  }

  async deleteUserCollection(userId: string, id: string): Promise<void> {
    const collection = await this.prisma.wordCollection.findFirst({
      where: {
        id,
        ownerUserId: userId,
        kind: WordCollectionKind.USER,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.isDefault) {
      throw new BadRequestException('Default collection cannot be deleted');
    }

    await this.prisma.wordCollection.delete({
      where: { id },
    });
  }

  async get(userId: string, id: string): Promise<CollectionDetail> {
    const collection = await this.findVisibleCollection(userId, id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const catalogWords =
      collection.kind === WordCollectionKind.SYSTEM
        ? await this.getCatalogWords(collection.cefrLevel)
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
    options: {
      targetCollectionId?: string;
      catalogDefinitionIds?: string[];
      offset?: number;
      limit?: number;
    } = {},
  ): Promise<ImportCollectionResult> {
    const { targetCollectionId, catalogDefinitionIds, offset, limit } = options;
    const hasCatalogPage = offset !== undefined || limit !== undefined;

    if (hasCatalogPage && (offset === undefined || limit === undefined)) {
      throw new BadRequestException(
        'Catalog page offset and limit are required',
      );
    }
    const collection = await this.findVisibleCollection(userId, id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.kind !== WordCollectionKind.SYSTEM) {
      throw new BadRequestException('Only system collections can be imported');
    }

    const targetCollection = targetCollectionId
      ? await this.findOwnedUserCollection(userId, targetCollectionId)
      : await this.getDefaultUserCollection(userId);

    if (!targetCollection) {
      throw new NotFoundException('Target collection not found');
    }

    let catalogWords = await this.getCatalogWords(
      collection.cefrLevel,
      hasCatalogPage
        ? { offset: offset as number, limit: limit as number }
        : undefined,
    );

    if (catalogDefinitionIds?.length) {
      const selectedDefinitionIds = new Set(catalogDefinitionIds);
      catalogWords = catalogWords
        .map((catalogWord) => ({
          ...catalogWord,
          definitions: catalogWord.definitions.filter((definition) =>
            selectedDefinitionIds.has(definition.id),
          ),
        }))
        .filter((catalogWord) => catalogWord.definitions.length > 0);
    }

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
        collectionId: targetCollection.id,
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
        this.toImportedVocabWord(userId, targetCollection.id, catalogWord),
      ),
      skipDuplicates: true,
    });
    const allWords = await this.prisma.vocabWord.findMany({
      where: {
        collectionId: targetCollection.id,
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
    const definitionsToRestore: ImportedDefinitionData[] = [];
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

  async getCatalogWordsPage(
    userId: string,
    id: string,
    options: { offset?: number; limit?: number } = {},
  ): Promise<CatalogWordsPage> {
    const collection = await this.findVisibleCollection(userId, id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.kind !== WordCollectionKind.SYSTEM) {
      throw new BadRequestException(
        'Only system collections have catalog words',
      );
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    const [items, total] = await Promise.all([
      this.getCatalogWords(collection.cefrLevel, {
        offset,
        limit,
      }),
      this.prisma.systemVocabularyEntry.count({
        where: this.systemVocabularyWhere(collection.cefrLevel),
      }),
    ]);

    return { items, total, offset, limit };
  }

  async getOxfordMeta(band: string): Promise<OxfordCollectionMeta> {
    this.assertOxfordBand(band);

    const itemCount = await this.prisma.systemVocabularyEntry.count({
      where: this.systemVocabularyWhere(band),
    });

    if (itemCount === 0) {
      throw new NotFoundException('Oxford collection not found');
    }

    return { band, itemCount };
  }

  async getOxfordPart(band: string, part: number): Promise<OxfordPart> {
    this.assertOxfordBand(band);
    const offset = this.getOxfordPartOffset(part);
    const items = await this.prisma.systemVocabularyEntry.findMany({
      where: this.systemVocabularyWhere(band),
      orderBy: { sortOrder: 'asc' },
      skip: offset,
      take: 20,
    });

    if (items.length === 0) {
      throw new NotFoundException('Oxford part not found');
    }

    return {
      items: items.map((entry) => this.toCatalogWordFromSystemEntry(entry)),
      limit: 20,
      offset,
    };
  }

  async importOxfordPart(
    userId: string,
    band: string,
    part: number,
    catalogDefinitionIds: string[],
  ): Promise<ImportCollectionResult> {
    this.assertOxfordBand(band);
    const collection = await this.prisma.wordCollection.findFirst({
      where: this.oxfordCollectionWhere(band),
    });

    if (!collection) {
      throw new NotFoundException('Oxford collection not found');
    }

    return this.importToVocabulary(userId, collection.id, {
      catalogDefinitionIds,
      limit: 20,
      offset: this.getOxfordPartOffset(part),
    });
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

  private assertOxfordBand(band: string) {
    if (!OXFORD_CEFR_LEVELS.includes(band)) {
      throw new BadRequestException('Unsupported Oxford band');
    }
  }

  private getOxfordPartOffset(part: number) {
    if (!Number.isSafeInteger(part) || part < 1) {
      throw new BadRequestException('Oxford part must be positive');
    }

    return (part - 1) * 20;
  }

  private oxfordCollectionWhere(band: string) {
    return {
      cefrLevel: band,
      isPublic: true,
      kind: WordCollectionKind.SYSTEM,
      source: OXFORD_COLLECTION_SOURCE,
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

  private findOwnedUserCollection(userId: string, id: string) {
    return this.prisma.wordCollection.findFirst({
      where: {
        id,
        ownerUserId: userId,
        kind: WordCollectionKind.USER,
      },
    });
  }

  private getDefaultUserCollection(userId: string) {
    return this.prisma.wordCollection.findFirst({
      where: {
        ownerUserId: userId,
        isDefault: true,
      },
    });
  }

  private async getCatalogWords(
    cefrLevel: string | null,
    page?: { offset: number; limit: number },
  ): Promise<CatalogWordResult[]> {
    const items = await this.prisma.systemVocabularyEntry.findMany({
      where: this.systemVocabularyWhere(cefrLevel),
      orderBy: { sortOrder: 'asc' },
      skip: page?.offset,
      take: page?.limit,
    });

    return items.map((entry) => this.toCatalogWordFromSystemEntry(entry));
  }

  private systemVocabularyWhere(cefrLevel: string | null) {
    return {
      ...(cefrLevel ? { band: cefrLevel } : {}),
      source: { in: OXFORD_DEFINITION_SOURCES },
    };
  }

  private toCatalogWordFromSystemEntry(
    entry: Awaited<
      ReturnType<PrismaService['systemVocabularyEntry']['findMany']>
    >[number],
  ): CatalogWordResult {
    return {
      id: entry.id,
      word: entry.word,
      normalizedWord: entry.normalizedWord,
      definitions: [
        {
          id: entry.id,
          sourceDefinitionId: entry.sourceDefinitionId,
          sourceWordId: entry.sourceWordId,
          type: entry.type,
          meaningVi: entry.meaningVi,
          definition: entry.definition,
          example: entry.example,
          exampleVi: entry.exampleVi,
          ipaUk: entry.ipaUk,
          ipaUs: entry.ipaUs,
          band: entry.band,
          source: entry.source,
        },
      ],
    };
  }

  private getUserVocabWords(collectionId: string) {
    return this.prisma.vocabWord.findMany({
      where: {
        collectionId,
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

  private toImportedVocabWord(
    userId: string,
    collectionId: string,
    catalogWord: CatalogWordResult,
  ) {
    return {
      userId,
      collectionId,
      word: catalogWord.word,
      normalizedWord: normalizeWord(catalogWord.word),
    };
  }

  private toImportedDefinition(
    vocabWordId: string,
    definition: CatalogDefinitionResult,
  ): ImportedDefinitionData {
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

  private toRestoredDefinitionData(definition: ImportedDefinitionData) {
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
    isDefault: boolean;
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
      isDefault: collection.isDefault,
      isPublic: collection.isPublic,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }
}

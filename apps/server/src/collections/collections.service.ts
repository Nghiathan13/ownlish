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
  vocabularyEntries: Awaited<
    ReturnType<PrismaService['userVocabularyEntry']['findMany']>
  >;
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
  parts: Array<{
    part: number;
    itemCount: number;
    masteredCount: number;
    learningCount: number;
    newCount: number;
  }>;
};

type OxfordPart = {
  items: CatalogWordResult[];
  limit: number;
  offset: number;
};

type OxfordProgressSummary = {
  total: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  levelCounts: Array<{ level: number; count: number }>;
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
            vocabularyEntries: true,
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
          : collection._count.vocabularyEntries,
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
            vocabularyEntries: true,
          },
        },
      },
    });

    return {
      ...this.toSummary(collection),
      itemCount: collection._count.vocabularyEntries,
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
            vocabularyEntries: true,
          },
        },
      },
    });

    return {
      ...this.toSummary(updatedCollection),
      itemCount: updatedCollection._count.vocabularyEntries,
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
    const vocabularyEntries =
      collection.kind === WordCollectionKind.USER
        ? await this.getUserVocabularyEntries(collection.id)
        : [];

    return {
      ...this.toSummary(collection),
      itemCount: catalogWords.length + vocabularyEntries.length,
      catalogWords,
      vocabularyEntries,
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

    const entries = catalogWords.flatMap((catalogWord) =>
      catalogWord.definitions.map((definition) =>
        this.toImportedVocabularyEntry(
          userId,
          targetCollection.id,
          catalogWord,
          definition,
        ),
      ),
    );
    const result = await this.prisma.userVocabularyEntry.createMany({
      data: entries,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      updated: 0,
      skipped: Math.max(0, entries.length - result.count),
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

  async getOxfordMeta(
    userId: string,
    band: string,
  ): Promise<OxfordCollectionMeta> {
    this.assertOxfordBand(band);

    const entries = await this.prisma.systemVocabularyEntry.findMany({
      where: this.systemVocabularyWhere(band),
      select: {
        id: true,
        progress: {
          where: { userId },
          select: { level: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (entries.length === 0) {
      throw new NotFoundException('Oxford collection not found');
    }

    const parts = entries.reduce<OxfordCollectionMeta['parts']>(
      (result, entry, index) => {
        const partIndex = Math.floor(index / 20);
        let part = result[partIndex];
        if (!part) {
          part = {
            part: partIndex + 1,
            itemCount: 0,
            masteredCount: 0,
            learningCount: 0,
            newCount: 0,
          };
          result.push(part);
        }

        part.itemCount += 1;
        const progress = entry.progress[0];
        if (!progress) {
          part.newCount += 1;
        } else if (progress.level === 7) {
          part.masteredCount += 1;
        } else {
          part.learningCount += 1;
        }

        return result;
      },
      [],
    );

    return { band, itemCount: entries.length, parts };
  }

  async getOxfordProgressSummary(
    userId: string,
    band?: string,
  ): Promise<OxfordProgressSummary> {
    if (band != null) {
      this.assertOxfordBand(band);
    }

    const entries = await this.prisma.systemVocabularyEntry.findMany({
      where: this.systemVocabularyWhere(band ?? null),
      select: {
        band: true,
        progress: {
          where: { userId },
          select: { level: true },
        },
      },
      orderBy: [{ band: 'asc' }, { sortOrder: 'asc' }],
    });
    const summary: OxfordProgressSummary = {
      total: 0,
      masteredCount: 0,
      learningCount: 0,
      newCount: 0,
      levelCounts: Array.from({ length: 7 }, (_, index) => ({
        level: index + 1,
        count: 0,
      })),
    };
    let currentBand: string | null = null;
    let cardLevels: number[] = [];

    const addCard = () => {
      if (!cardLevels.some((level) => level > 0)) return;

      summary.total += cardLevels.length;
      for (const level of cardLevels) {
        if (level === 7) {
          summary.masteredCount += 1;
        } else if (level > 0) {
          summary.learningCount += 1;
        } else {
          summary.newCount += 1;
        }

        if (level >= 1 && level <= 7) {
          summary.levelCounts[level - 1].count += 1;
        }
      }
    };

    for (const entry of entries) {
      if (currentBand !== entry.band || cardLevels.length === 20) {
        addCard();
        currentBand = entry.band;
        cardLevels = [];
      }

      cardLevels.push(entry.progress[0]?.level ?? 0);
    }
    addCard();

    return summary;
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
    targetCollectionId?: string,
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
      targetCollectionId,
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

  private getUserVocabularyEntries(collectionId: string) {
    return this.prisma.userVocabularyEntry.findMany({
      where: { collectionId },
      orderBy: [{ word: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private toImportedVocabularyEntry(
    userId: string,
    collectionId: string,
    catalogWord: CatalogWordResult,
    definition: CatalogDefinitionResult,
  ) {
    return {
      userId,
      collectionId,
      systemEntryId: definition.id,
      word: catalogWord.word,
      normalizedWord: normalizeWord(catalogWord.word),
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

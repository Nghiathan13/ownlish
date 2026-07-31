import { WordCollectionKind } from '@prisma/client';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  const now = new Date('2026-07-24T00:00:00.000Z');
  const collection = {
    id: 'collection-id',
    name: 'Oxford A1',
    description: 'Oxford vocabulary words for CEFR A1.',
    kind: WordCollectionKind.SYSTEM,
    source: 'oxford',
    cefrLevel: 'A1',
    isDefault: false,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };
  const prisma = {
    systemVocabularyEntry: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    wordCollection: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const service = new CollectionsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses system entries for system collection counts', async () => {
    prisma.wordCollection.findMany.mockResolvedValue([
      { ...collection, _count: { vocabWords: 0 } },
    ]);
    prisma.systemVocabularyEntry.groupBy.mockResolvedValue([
      { band: 'A1', _count: { _all: 957 } },
    ]);

    await expect(service.list('user-id')).resolves.toEqual([
      { ...collection, itemCount: 957 },
    ]);
  });

  it('loads a catalog page from the requested system entry range', async () => {
    prisma.wordCollection.findFirst.mockResolvedValue(collection);
    prisma.systemVocabularyEntry.count.mockResolvedValue(957);
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      entry('entry-id'),
    ]);

    await expect(
      service.getCatalogWordsPage('user-id', 'collection-id', {
        limit: 20,
        offset: 20,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          id: 'entry-id',
          word: 'about',
          definitions: [{ id: 'entry-id', meaningVi: 'khoảng' }],
        },
      ],
      limit: 20,
      offset: 20,
      total: 957,
    });
    expect(prisma.systemVocabularyEntry.findMany).toHaveBeenCalledWith({
      where: { band: 'A1', source: { in: ['oxford_3000', 'oxford_5000'] } },
      orderBy: { sortOrder: 'asc' },
      skip: 20,
      take: 20,
    });
  });

  it('loads Oxford metadata and each part from system entries', async () => {
    prisma.systemVocabularyEntry.findMany
      .mockResolvedValueOnce([
        entry('new-entry'),
        entry('learning-entry', 2),
        entry('mastered-entry', 7),
      ])
      .mockResolvedValueOnce([entry('entry-id')]);

    await expect(service.getOxfordMeta('user-id', 'A1')).resolves.toEqual({
      band: 'A1',
      itemCount: 3,
      parts: [
        {
          part: 1,
          itemCount: 3,
          masteredCount: 1,
          learningCount: 1,
          newCount: 1,
        },
      ],
    });
    await expect(service.getOxfordPart('A1', 2)).resolves.toMatchObject({
      items: [{ id: 'entry-id', definitions: [{ id: 'entry-id' }] }],
      limit: 20,
      offset: 20,
    });
  });

  it('counts only words inside Oxford cards that have been started', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      entry('learning-entry', 2),
      entry('mastered-entry', 7),
      ...Array.from({ length: 18 }, (_, index) => entry(`new-${index}`)),
      entry('unstarted-entry'),
    ]);

    await expect(service.getOxfordProgressSummary('user-id')).resolves.toEqual({
      total: 20,
      masteredCount: 1,
      learningCount: 1,
      newCount: 18,
      levelCounts: [
        { level: 1, count: 0 },
        { level: 2, count: 1 },
        { level: 3, count: 0 },
        { level: 4, count: 0 },
        { level: 5, count: 0 },
        { level: 6, count: 0 },
        { level: 7, count: 1 },
      ],
    });
    expect(prisma.systemVocabularyEntry.findMany).toHaveBeenCalledWith({
      where: { source: { in: ['oxford_3000', 'oxford_5000'] } },
      select: {
        band: true,
        progress: {
          where: { userId: 'user-id' },
          select: { level: true },
        },
      },
      orderBy: [{ band: 'asc' }, { sortOrder: 'asc' }],
    });
  });

  it('filters Oxford progress summary by band when provided', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      entry('learning-entry', 2),
      entry('mastered-entry', 7),
      ...Array.from({ length: 18 }, (_, index) => entry(`new-${index}`)),
    ]);

    await expect(
      service.getOxfordProgressSummary('user-id', 'A1'),
    ).resolves.toEqual({
      total: 20,
      masteredCount: 1,
      learningCount: 1,
      newCount: 18,
      levelCounts: [
        { level: 1, count: 0 },
        { level: 2, count: 1 },
        { level: 3, count: 0 },
        { level: 4, count: 0 },
        { level: 5, count: 0 },
        { level: 6, count: 0 },
        { level: 7, count: 1 },
      ],
    });
    expect(prisma.systemVocabularyEntry.findMany).toHaveBeenCalledWith({
      where: {
        band: 'A1',
        source: { in: ['oxford_3000', 'oxford_5000'] },
      },
      select: {
        band: true,
        progress: {
          where: { userId: 'user-id' },
          select: { level: true },
        },
      },
      orderBy: [{ band: 'asc' }, { sortOrder: 'asc' }],
    });
  });
});

function entry(id: string, level?: number) {
  return {
    id,
    word: 'about',
    normalizedWord: 'about',
    sourceWordId: 101,
    type: 'adverb',
    meaningVi: 'khoảng',
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: 'A1',
    source: 'oxford_3000',
    sortOrder: 1,
    progress: level === undefined ? [] : [{ level }],
  };
}

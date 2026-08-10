import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { VocabService } from './vocab.service';

describe('VocabService', () => {
  const entry = {
    id: 'entry-id',
    userId: 'user-id',
    collectionId: 'collection-id',
    systemEntryId: null,
    word: 'hello',
    normalizedWord: 'hello',
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: null,
    source: 'manual',
    level: 2,
    wrongCount: 1,
    lastReview: null,
    nextReview: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const prisma = {
    wordCollection: { findFirst: jest.fn() },
    userVocabularyEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: VocabService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.wordCollection.findFirst.mockResolvedValue({ id: 'collection-id' });
    const module: TestingModule = await Test.createTestingModule({
      providers: [VocabService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(VocabService);
  });

  it('lists flat entries with pagination', async () => {
    prisma.userVocabularyEntry.findMany.mockResolvedValue([entry]);
    prisma.userVocabularyEntry.count.mockResolvedValue(1);

    await expect(
      service.list('user-id', { collectionId: 'collection-id' }),
    ).resolves.toEqual({
      items: [entry],
      meta: { limit: 50, offset: 0, total: 1, hasMore: false },
    });
    expect(prisma.userVocabularyEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-id', collectionId: 'collection-id' },
      }),
    );
  });

  it('normalizes search text and reports another page when entries remain', async () => {
    prisma.userVocabularyEntry.findMany.mockResolvedValue([entry]);
    prisma.userVocabularyEntry.count.mockResolvedValue(3);

    await expect(
      service.list('user-id', {
        collectionId: 'collection-id',
        search: '  HEL  ',
        limit: 1,
        offset: 1,
      }),
    ).resolves.toMatchObject({
      meta: { limit: 1, offset: 1, total: 3, hasMore: true },
    });
    expect(prisma.userVocabularyEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-id',
          collectionId: 'collection-id',
          normalizedWord: { contains: 'hel' },
        },
        take: 1,
        skip: 1,
      }),
    );
  });

  it('lists non-mastered entries that have no review date or are due', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-24T10:00:00.000Z'));
    prisma.userVocabularyEntry.findMany.mockResolvedValue([entry]);
    prisma.userVocabularyEntry.count.mockResolvedValue(1);

    try {
      await expect(
        service.listDueReviewWords('user-id', {
          collectionId: 'collection-id',
          limit: 20,
          offset: 3,
        }),
      ).resolves.toMatchObject({
        meta: { limit: 20, offset: 3, total: 1, hasMore: false },
      });
      expect(prisma.userVocabularyEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            level: { lt: 7 },
            OR: [
              { nextReview: null },
              { nextReview: { lte: expect.any(Date) as unknown as Date } },
            ],
          }) as never,
          take: 20,
          skip: 3,
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('creates a manual entry with normalized optional fields', async () => {
    prisma.userVocabularyEntry.create.mockResolvedValue(entry);

    await expect(
      service.create('user-id', {
        collectionId: 'collection-id',
        word: '  Hello  ',
        type: ' noun ',
        meaningVi: ' ',
        level: 3,
        wrongCount: 2,
      }),
    ).resolves.toBe(entry);
    expect(prisma.userVocabularyEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        collectionId: 'collection-id',
        word: 'Hello',
        normalizedWord: 'hello',
        source: 'manual',
        type: 'noun',
        meaningVi: null,
        level: 3,
        wrongCount: 2,
      }) as never,
    });
  });

  it('rejects blank words and collections that do not belong to the user', async () => {
    await expect(
      service.create('user-id', { collectionId: 'collection-id', word: '  ' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.wordCollection.findFirst.mockResolvedValue(null);
    await expect(
      service.list('user-id', { collectionId: 'other-collection' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates editable manual words but preserves Oxford definitions', async () => {
    prisma.userVocabularyEntry.findFirst.mockResolvedValue(entry);
    prisma.userVocabularyEntry.update.mockResolvedValue(entry);

    await service.update('user-id', 'entry-id', {
      word: '  World ',
      meaningVi: ' thế giới ',
      wrongCount: 4,
    });
    expect(prisma.userVocabularyEntry.update).toHaveBeenLastCalledWith({
      where: { id: 'entry-id' },
      data: {
        word: 'World',
        normalizedWord: 'world',
        meaningVi: 'thế giới',
        wrongCount: 4,
      },
    });

    prisma.userVocabularyEntry.findFirst.mockResolvedValue({
      ...entry,
      source: 'oxford_3000',
    });
    await service.update('user-id', 'entry-id', {
      word: 'Ignored',
      band: ' B2 ',
    });
    expect(prisma.userVocabularyEntry.update).toHaveBeenLastCalledWith({
      where: { id: 'entry-id' },
      data: { band: 'B2' },
    });
  });

  it('grades an owned entry from its server-side progress', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-24T10:00:00.000Z'));
    prisma.userVocabularyEntry.findFirst.mockResolvedValue(entry);
    prisma.userVocabularyEntry.update.mockResolvedValue(entry);

    try {
      await service.updateReview('user-id', 'entry-id', { rating: 'FORGET' });
      const [input] = prisma.userVocabularyEntry.update.mock
        .calls[0] as unknown as [
        {
          where: { id: string };
          data: { level: number; wrongCount: number; nextReview: Date };
        },
      ];
      expect(input.where).toEqual({ id: 'entry-id' });
      expect(input.data).toMatchObject({
        level: 0,
        wrongCount: 2,
        nextReview: new Date('2026-07-24T11:46:40.000Z'),
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('hard deletes only an owned entry', async () => {
    prisma.userVocabularyEntry.findFirst.mockResolvedValue(entry);
    prisma.userVocabularyEntry.delete.mockResolvedValue(entry);

    await expect(service.delete('user-id', 'entry-id')).resolves.toEqual({
      deletedEntryId: 'entry-id',
    });
    expect(prisma.userVocabularyEntry.delete).toHaveBeenCalledWith({
      where: { id: 'entry-id' },
    });
  });

  it('rejects access to a missing entry', async () => {
    prisma.userVocabularyEntry.findFirst.mockResolvedValue(null);

    await expect(service.get('user-id', 'missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

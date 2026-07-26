import { NotFoundException } from '@nestjs/common';
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

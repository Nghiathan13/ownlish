import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { VocabStatsService } from './vocab-stats.service';

describe('VocabStatsService', () => {
  let service: VocabStatsService;

  const prismaMock = {
    wordCollection: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const collectionId = 'collection-id';

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.wordCollection.findFirst.mockResolvedValue({ id: collectionId });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabStatsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<VocabStatsService>(VocabStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gets vocabulary stats for a user', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-07T00:00:00.000Z'));
    prismaMock.$queryRaw.mockResolvedValue([
      {
        total: 10,
        due: 4,
        mastered: 2,
        high_wrong_count: 3,
        levels: [
          { level: 0, count: 4 },
          { level: 7, count: 2 },
        ],
      },
    ]);

    try {
      await expect(service.getStats('user-id', collectionId)).resolves.toEqual({
        total: 10,
        due: 4,
        mastered: 2,
        highWrongCount: 3,
        levels: [
          { level: 0, count: 4 },
          { level: 1, count: 0 },
          { level: 2, count: 0 },
          { level: 3, count: 0 },
          { level: 4, count: 0 },
          { level: 5, count: 0 },
          { level: 6, count: 0 },
          { level: 7, count: 2 },
        ],
      });

      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('gets vocabulary stats across all collections when collectionId is omitted', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-07T00:00:00.000Z'));
    prismaMock.$queryRaw.mockResolvedValue([
      {
        total: 10,
        due: 4,
        mastered: 2,
        high_wrong_count: 3,
        levels: [
          { level: 0, count: 4 },
          { level: 7, count: 2 },
        ],
      },
    ]);

    try {
      await expect(service.getStats('user-id')).resolves.toEqual({
        total: 10,
        due: 4,
        mastered: 2,
        highWrongCount: 3,
        levels: [
          { level: 0, count: 4 },
          { level: 1, count: 0 },
          { level: 2, count: 0 },
          { level: 3, count: 0 },
          { level: 4, count: 0 },
          { level: 5, count: 0 },
          { level: 6, count: 0 },
          { level: 7, count: 2 },
        ],
      });
      expect(prismaMock.wordCollection.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns zero-filled stats when the aggregate query has no row', async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);

    await expect(service.getStats('user-id')).resolves.toEqual({
      total: 0,
      due: 0,
      mastered: 0,
      highWrongCount: 0,
      levels: Array.from({ length: 8 }, (_, level) => ({ level, count: 0 })),
    });
  });

  it('rejects stats for a collection that is not owned by the user', async () => {
    prismaMock.wordCollection.findFirst.mockResolvedValue(null);

    await expect(
      service.getStats('user-id', collectionId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
});

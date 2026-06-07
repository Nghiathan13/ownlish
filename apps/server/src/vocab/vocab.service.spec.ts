import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { VocabService } from './vocab.service';

describe('VocabService', () => {
  let service: VocabService;

  const prismaMock = {
    vocabWord: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const vocabWord = {
    id: 'word-id',
    userId: 'user-id',
    word: 'hello',
    normalizedWord: 'hello',
    ipa: null,
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    band: null,
    level: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<VocabService>(VocabService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists active words for a user', async () => {
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);

    await expect(service.list('user-id')).resolves.toEqual([vocabWord]);
    expect(prismaMock.vocabWord.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      skip: 0,
    });
  });

  it('lists active words with pagination', async () => {
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);

    await service.list('user-id', {
      limit: 10,
      offset: 20,
    });

    expect(prismaMock.vocabWord.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      skip: 20,
    });
  });

  it('lists due review words for a user', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-07T00:00:00.000Z'));
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);

    try {
      await expect(service.listDueReviewWords('user-id')).resolves.toEqual([
        vocabWord,
      ]);

      expect(prismaMock.vocabWord.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          deletedAt: null,
          OR: [
            {
              nextReview: null,
            },
            {
              nextReview: {
                lte: new Date('2026-06-07T00:00:00.000Z'),
              },
            },
          ],
        },
        orderBy: [
          {
            nextReview: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('gets an active word for a user', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);

    await expect(service.get('user-id', 'word-id')).resolves.toBe(vocabWord);
    expect(prismaMock.vocabWord.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'word-id',
        userId: 'user-id',
        deletedAt: null,
      },
    });
  });

  it('throws not found when getting a missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(service.get('user-id', 'missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a word with normalized word', async () => {
    prismaMock.vocabWord.create.mockResolvedValue(vocabWord);

    await expect(
      service.create('user-id', {
        word: ' Hello ',
        meaningVi: 'xin chao',
      }),
    ).resolves.toBe(vocabWord);

    expect(prismaMock.vocabWord.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        word: 'Hello',
        normalizedWord: 'hello',
        meaningVi: 'xin chao',
      },
    });
  });

  it('throws conflict when creating duplicate word', async () => {
    prismaMock.vocabWord.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create('user-id', {
        word: 'hello',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws bad request when creating a blank word', async () => {
    await expect(
      service.create('user-id', {
        word: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.vocabWord.create).not.toHaveBeenCalled();
  });

  it('updates an active word and normalizes changed word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);
    prismaMock.vocabWord.update.mockResolvedValue({
      ...vocabWord,
      word: 'updated',
      normalizedWord: 'updated',
    });

    await expect(
      service.update('user-id', 'word-id', {
        word: ' Updated ',
      }),
    ).resolves.toMatchObject({
      word: 'updated',
      normalizedWord: 'updated',
    });

    expect(prismaMock.vocabWord.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'word-id',
        userId: 'user-id',
        deletedAt: null,
      },
    });
    expect(prismaMock.vocabWord.update).toHaveBeenCalledWith({
      where: { id: 'word-id' },
      data: {
        word: 'Updated',
        normalizedWord: 'updated',
      },
    });
  });

  it('throws not found when updating missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-id', 'missing-id', {
        word: 'hello',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates review fields for an active word', async () => {
    const lastReview = '2026-06-07T00:00:00.000Z';
    const nextReview = '2026-06-08T00:00:00.000Z';

    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);
    prismaMock.vocabWord.update.mockResolvedValue({
      ...vocabWord,
      level: 2,
      wrongCount: 1,
      lastReview: new Date(lastReview),
      nextReview: new Date(nextReview),
    });

    await expect(
      service.updateReview('user-id', 'word-id', {
        level: 2,
        wrongCount: 1,
        lastReview,
        nextReview,
      }),
    ).resolves.toMatchObject({
      level: 2,
      wrongCount: 1,
    });

    expect(prismaMock.vocabWord.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'word-id',
        userId: 'user-id',
        deletedAt: null,
      },
    });
    expect(prismaMock.vocabWord.update).toHaveBeenCalledWith({
      where: { id: 'word-id' },
      data: {
        level: 2,
        wrongCount: 1,
        lastReview: new Date(lastReview),
        nextReview: new Date(nextReview),
      },
    });
  });

  it('throws not found when updating review for a missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.updateReview('user-id', 'missing-id', {
        level: 2,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
  });

  it('throws bad request when updating to a blank word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);

    await expect(
      service.update('user-id', 'word-id', {
        word: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
  });

  it('soft deletes an active word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);
    prismaMock.vocabWord.update.mockResolvedValue({
      ...vocabWord,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await service.softDelete('user-id', 'word-id');

    expect(prismaMock.vocabWord.update).toHaveBeenCalledWith({
      where: { id: 'word-id' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it('throws not found when deleting missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.softDelete('user-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

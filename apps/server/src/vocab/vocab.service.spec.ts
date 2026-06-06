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
    });
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

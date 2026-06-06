import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthRequest } from '../auth/types/auth.types';
import { VocabController } from './vocab.controller';
import { VocabService } from './vocab.service';

describe('VocabController', () => {
  let controller: VocabController;

  const vocabServiceMock = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  const request = {
    user: {
      id: 'user-id',
      email: 'test@example.com',
    },
  } as AuthRequest;

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
      controllers: [VocabController],
      providers: [
        {
          provide: VocabService,
          useValue: vocabServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    controller = module.get<VocabController>(VocabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list to VocabService with current user id', async () => {
    vocabServiceMock.list.mockResolvedValue([vocabWord]);
    const query = {
      limit: 10,
      offset: 20,
    };

    await expect(controller.list(request, query)).resolves.toEqual([vocabWord]);
    expect(vocabServiceMock.list).toHaveBeenCalledWith('user-id', query);
  });

  it('delegates get to VocabService with current user id', async () => {
    vocabServiceMock.get.mockResolvedValue(vocabWord);

    await expect(controller.get(request, 'word-id')).resolves.toBe(vocabWord);
    expect(vocabServiceMock.get).toHaveBeenCalledWith('user-id', 'word-id');
  });

  it('delegates create to VocabService with current user id', async () => {
    const dto = {
      word: 'hello',
      meaningVi: 'xin chao',
    };
    vocabServiceMock.create.mockResolvedValue(vocabWord);

    await expect(controller.create(request, dto)).resolves.toBe(vocabWord);
    expect(vocabServiceMock.create).toHaveBeenCalledWith('user-id', dto);
  });

  it('delegates update to VocabService with current user id', async () => {
    const dto = {
      word: 'updated',
    };
    vocabServiceMock.update.mockResolvedValue({
      ...vocabWord,
      word: 'updated',
      normalizedWord: 'updated',
    });

    await controller.update(request, 'word-id', dto);
    expect(vocabServiceMock.update).toHaveBeenCalledWith(
      'user-id',
      'word-id',
      dto,
    );
  });

  it('delegates soft delete to VocabService with current user id', async () => {
    vocabServiceMock.softDelete.mockResolvedValue({
      ...vocabWord,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await controller.softDelete(request, 'word-id');
    expect(vocabServiceMock.softDelete).toHaveBeenCalledWith(
      'user-id',
      'word-id',
    );
  });
});

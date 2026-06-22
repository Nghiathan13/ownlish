import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthRequest } from '../auth/types/auth.types';
import { VocabController } from './vocab.controller';
import { VocabStatsService } from './vocab-stats.service';
import { VocabService } from './vocab.service';

describe('VocabController', () => {
  let controller: VocabController;

  const vocabServiceMock = {
    list: jest.fn(),
    listDueReviewWords: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateReview: jest.fn(),
    softDeleteDefinition: jest.fn(),
    softDelete: jest.fn(),
  };
  const vocabStatsServiceMock = {
    getStats: jest.fn(),
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
          provide: VocabStatsService,
          useValue: vocabStatsServiceMock,
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
    const response = {
      items: [vocabWord],
      meta: {
        limit: 10,
        offset: 20,
        total: 1,
        hasMore: false,
      },
    };
    vocabServiceMock.list.mockResolvedValue(response);
    const query = {
      collectionId: 'collection-id',
      limit: 10,
      offset: 20,
    };

    await expect(controller.list(request, query)).resolves.toEqual(response);
    expect(vocabServiceMock.list).toHaveBeenCalledWith('user-id', query);
  });

  it('delegates due review list to VocabService with current user id', async () => {
    const response = {
      items: [vocabWord],
      meta: {
        limit: 10,
        offset: 0,
        total: 1,
        hasMore: false,
      },
    };
    const query = {
      collectionId: 'collection-id',
      limit: 10,
      offset: 0,
    };
    vocabServiceMock.listDueReviewWords.mockResolvedValue(response);

    await expect(
      controller.listDueReviewWords(request, query),
    ).resolves.toEqual(response);
    expect(vocabServiceMock.listDueReviewWords).toHaveBeenCalledWith(
      'user-id',
      query,
    );
  });

  it('delegates stats to VocabService with current user id', async () => {
    const response = {
      total: 1,
      due: 1,
      mastered: 0,
      highWrongCount: 0,
      levels: [{ level: 0, count: 1 }],
    };
    const statsQuery = {
      collectionId: 'collection-id',
    };
    vocabStatsServiceMock.getStats.mockResolvedValue(response);

    await expect(controller.getStats(request, statsQuery)).resolves.toEqual(
      response,
    );
    expect(vocabStatsServiceMock.getStats).toHaveBeenCalledWith(
      'user-id',
      'collection-id',
    );
  });

  it('delegates get to VocabService with current user id', async () => {
    vocabServiceMock.get.mockResolvedValue(vocabWord);

    await expect(controller.get(request, 'word-id')).resolves.toBe(vocabWord);
    expect(vocabServiceMock.get).toHaveBeenCalledWith('user-id', 'word-id');
  });

  it('delegates create to VocabService with current user id', async () => {
    const dto = {
      collectionId: 'collection-id',
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
    const response = {
      ...vocabWord,
      word: 'updated',
      normalizedWord: 'updated',
    };
    vocabServiceMock.update.mockResolvedValue(response);

    await expect(controller.update(request, 'word-id', dto)).resolves.toEqual(
      response,
    );
    expect(vocabServiceMock.update).toHaveBeenCalledWith(
      'user-id',
      'word-id',
      dto,
    );
  });

  it('delegates update review to VocabService with current user id', async () => {
    const dto = {
      level: 2,
      wrongCount: 1,
      lastReview: '2026-06-07T00:00:00.000Z',
      nextReview: '2026-06-08T00:00:00.000Z',
    };
    const response = {
      ...vocabWord,
      level: 2,
      wrongCount: 1,
      lastReview: new Date(dto.lastReview),
      nextReview: new Date(dto.nextReview),
    };
    vocabServiceMock.updateReview.mockResolvedValue(response);

    await expect(
      controller.updateReview(request, 'word-id', dto),
    ).resolves.toEqual(response);
    expect(vocabServiceMock.updateReview).toHaveBeenCalledWith(
      'user-id',
      'word-id',
      dto,
    );
  });

  it('delegates definition soft delete to VocabService with current user id', async () => {
    const response = {
      deletedDefinitionId: 'definition-id',
      vocabWordId: 'word-id',
      wordRemoved: true,
    };
    vocabServiceMock.softDeleteDefinition.mockResolvedValue(response);

    await expect(
      controller.softDeleteDefinition(request, 'definition-id'),
    ).resolves.toEqual(response);
    expect(vocabServiceMock.softDeleteDefinition).toHaveBeenCalledWith(
      'user-id',
      'definition-id',
    );
  });

  it('delegates soft delete to VocabService with current user id', async () => {
    const response = {
      ...vocabWord,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    vocabServiceMock.softDelete.mockResolvedValue(response);

    await expect(controller.softDelete(request, 'word-id')).resolves.toEqual(
      response,
    );
    expect(vocabServiceMock.softDelete).toHaveBeenCalledWith(
      'user-id',
      'word-id',
    );
  });
});

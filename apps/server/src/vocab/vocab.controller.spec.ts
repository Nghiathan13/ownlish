import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthRequest } from '../auth/types/auth.types';
import { VocabController } from './vocab.controller';
import { VocabStatsService } from './vocab-stats.service';
import { VocabService } from './vocab.service';

describe('VocabController', () => {
  const vocabService = {
    list: jest.fn(),
    listDueReviewWords: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateReview: jest.fn(),
    delete: jest.fn(),
  };
  const statsService = { getStats: jest.fn() };
  const request = {
    user: { id: 'user-id', email: 'test@example.com' },
  } as AuthRequest;
  let controller: VocabController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabController],
      providers: [
        { provide: VocabService, useValue: vocabService },
        { provide: VocabStatsService, useValue: statsService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();
    controller = module.get(VocabController);
  });

  it('delegates mutations using the authenticated user', async () => {
    const entry = { id: 'entry-id' };
    vocabService.create.mockResolvedValue(entry);
    vocabService.updateReview.mockResolvedValue(entry);
    vocabService.delete.mockResolvedValue({ deletedEntryId: 'entry-id' });

    await expect(
      controller.create(request, {
        collectionId: 'collection-id',
        word: 'hello',
      }),
    ).resolves.toBe(entry);
    await expect(
      controller.updateReview(request, 'entry-id', { rating: 'GOOD' }),
    ).resolves.toBe(entry);
    await expect(controller.delete(request, 'entry-id')).resolves.toEqual({
      deletedEntryId: 'entry-id',
    });
    expect(vocabService.create).toHaveBeenCalledWith(
      'user-id',
      expect.anything(),
    );
    expect(vocabService.updateReview).toHaveBeenCalledWith(
      'user-id',
      'entry-id',
      { rating: 'GOOD' },
    );
    expect(vocabService.delete).toHaveBeenCalledWith('user-id', 'entry-id');
  });

  it('delegates every read and update endpoint with the authenticated user id', async () => {
    const listQuery = { collectionId: 'collection-id', search: 'hello' };
    const dueQuery = { collectionId: 'collection-id', limit: 10 };
    const update = { meaningVi: 'xin chào' };
    vocabService.list.mockResolvedValue({ items: [] });
    vocabService.listDueReviewWords.mockResolvedValue({ items: [] });
    vocabService.get.mockResolvedValue({ id: 'entry-id' });
    vocabService.update.mockResolvedValue({ id: 'entry-id' });
    statsService.getStats.mockResolvedValue({ total: 1 });

    await expect(controller.list(request, listQuery)).resolves.toEqual({
      items: [],
    });
    await expect(
      controller.getStats(request, { collectionId: 'collection-id' }),
    ).resolves.toEqual({ total: 1 });
    await expect(
      controller.listDueReviewWords(request, dueQuery),
    ).resolves.toEqual({ items: [] });
    await expect(controller.get(request, 'entry-id')).resolves.toEqual({
      id: 'entry-id',
    });
    await expect(
      controller.update(request, 'entry-id', update),
    ).resolves.toEqual({ id: 'entry-id' });

    expect(vocabService.list).toHaveBeenCalledWith('user-id', listQuery);
    expect(statsService.getStats).toHaveBeenCalledWith(
      'user-id',
      'collection-id',
    );
    expect(vocabService.listDueReviewWords).toHaveBeenCalledWith(
      'user-id',
      dueQuery,
    );
    expect(vocabService.get).toHaveBeenCalledWith('user-id', 'entry-id');
    expect(vocabService.update).toHaveBeenCalledWith(
      'user-id',
      'entry-id',
      update,
    );
  });
});

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
});

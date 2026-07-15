import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { PartPracticeService } from './part-practice.service';
import { ToeicPartPracticeGrader } from './lib/toeic-part-practice/grader';
import { ToeicPartPracticeMaterializer } from './lib/toeic-part-practice/materializer';
import { ToeicPartPracticeRepository } from './lib/toeic-part-practice/repository';
import { ToeicPartPracticeSessionMapper } from './lib/toeic-part-practice/session.mapper';
import { buildPartPracticeRunForResponse } from './testing/part-practice.fixtures';

describe('PartPracticeService', () => {
  let service: PartPracticeService;

  const repositoryMock = {
    listCatalogPartNumbers: jest.fn(),
    countCatalogQuestionsByPart: jest.fn(),
    findRunByUserAndPart: jest.fn(),
    countAnswersByStatus: jest.fn(),
    findOwnedRunMeta: jest.fn(),
    resetPartPracticeAnswers: jest.fn(),
  };
  const materializerMock = {
    findOrCreateRun: jest.fn(),
  };
  const sessionMapperMock = {
    formatSessionResponse: jest.fn(),
  };
  const graderMock = {
    submitAnswer: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.listCatalogPartNumbers.mockResolvedValue([1, 2]);
    repositoryMock.countCatalogQuestionsByPart.mockResolvedValue(5);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartPracticeService,
        { provide: ToeicPartPracticeRepository, useValue: repositoryMock },
        { provide: ToeicPartPracticeMaterializer, useValue: materializerMock },
        {
          provide: ToeicPartPracticeSessionMapper,
          useValue: sessionMapperMock,
        },
        { provide: ToeicPartPracticeGrader, useValue: graderMock },
      ],
    }).compile();

    service = module.get(PartPracticeService);
  });

  it('lists part summaries with catalog totals and user progress', async () => {
    repositoryMock.findRunByUserAndPart
      .mockResolvedValueOnce({ id: 'run-1' })
      .mockResolvedValueOnce(null);
    repositoryMock.countAnswersByStatus
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    await expect(service.listPartSummaries('user-id')).resolves.toEqual({
      items: [
        {
          partNumber: 1,
          total: 5,
          answered: 3,
          correct: 2,
          wrong: 1,
        },
        {
          partNumber: 2,
          total: 5,
          answered: 0,
          correct: 0,
          wrong: 0,
        },
      ],
    });

    expect(repositoryMock.countAnswersByStatus).toHaveBeenCalledWith(
      'run-1',
      ToeicRunQuestionStatus.RIGHT,
    );
  });

  it('reuses the same run when creating practice for a part', async () => {
    const run = buildPartPracticeRunForResponse({ id: 'run-id' });
    const formatted = { sessionId: 'run-id', mode: 'practice' };

    materializerMock.findOrCreateRun.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(formatted);

    await expect(service.createRun('user-id', { partNumber: 1 })).resolves.toBe(
      formatted,
    );

    expect(materializerMock.findOrCreateRun).toHaveBeenCalledWith('user-id', 1);
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(run, {
      mode: 'practice',
    });
  });

  it('creates a review wrong session with mode option', async () => {
    const run = buildPartPracticeRunForResponse({ id: 'run-id' });
    const formatted = { sessionId: 'run-id', mode: 'review_wrong' };

    materializerMock.findOrCreateRun.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(formatted);

    await expect(
      service.createRun('user-id', { partNumber: 1, mode: 'review_wrong' }),
    ).resolves.toBe(formatted);

    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(run, {
      mode: 'review_wrong',
    });
  });

  it('clears only aggregate history for the requested part', async () => {
    repositoryMock.resetPartPracticeAnswers.mockResolvedValue(1);

    await expect(service.clearPartHistory('user-id', 1)).resolves.toEqual({
      resetRunCount: 1,
    });

    expect(repositoryMock.resetPartPracticeAnswers).toHaveBeenCalledWith(
      'user-id',
      1,
    );
  });
});

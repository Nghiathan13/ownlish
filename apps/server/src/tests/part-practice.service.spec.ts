import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunGroupStatus, ToeicRunQuestionStatus } from '@prisma/client';
import { PartPracticeService } from './part-practice.service';
import { ToeicPartPracticeGrader } from './lib/toeic-part-practice/grader';
import { ToeicPartPracticeMaterializer } from './lib/toeic-part-practice/materializer';
import { ToeicPartPracticeRepository } from './lib/toeic-part-practice/repository';
import { ToeicPartPracticeSessionMapper } from './lib/toeic-part-practice/session.mapper';
import type { FormatPartPracticeSessionResponseOptions } from './lib/toeic-part-practice/session.types';
import {
  buildPartPracticePhotoRunGroup,
  buildPartPracticeRunForResponse,
} from './testing/part-practice.fixtures';
import { getMockCallArg } from '../testing/jest-mock-call';

describe('PartPracticeService', () => {
  let service: PartPracticeService;

  const repositoryMock = {
    listCatalogPartNumbers: jest.fn(),
    countCatalogQuestionsByPart: jest.fn(),
    findRunByUserAndPart: jest.fn(),
    countRunQuestionsByStatus: jest.fn(),
    findOwnedRunMeta: jest.fn(),
    resetPartPracticeAnswers: jest.fn(),
  };
  const materializerMock = {
    findOrCreateRunWithQuestions: jest.fn(),
    findRunForResponse: jest.fn(),
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
    repositoryMock.countRunQuestionsByStatus
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

    expect(repositoryMock.countRunQuestionsByStatus).toHaveBeenCalledWith(
      'run-1',
      ToeicRunQuestionStatus.RIGHT,
    );
  });

  it('reuses the same run when creating practice for a part', async () => {
    const run = buildPartPracticeRunForResponse({ id: 'run-id' });
    const formatted = { sessionId: 'run-id', mode: 'practice' };

    materializerMock.findOrCreateRunWithQuestions.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(formatted);

    await expect(service.createRun('user-id', { partNumber: 1 })).resolves.toBe(
      formatted,
    );

    expect(materializerMock.findOrCreateRunWithQuestions).toHaveBeenCalledWith(
      'user-id',
      1,
    );
  });

  it('creates a review wrong session with group filter', async () => {
    const run = buildPartPracticeRunForResponse({
      groups: [
        buildPartPracticePhotoRunGroup({
          status: ToeicRunGroupStatus.WRONG,
        }),
      ],
    });
    const formatted = { sessionId: 'run-id', mode: 'review_wrong' };

    materializerMock.findOrCreateRunWithQuestions.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(formatted);

    await expect(
      service.createRun('user-id', { partNumber: 1, mode: 'review_wrong' }),
    ).resolves.toBe(formatted);

    const formatOptions =
      getMockCallArg<FormatPartPracticeSessionResponseOptions>(
        sessionMapperMock.formatSessionResponse,
        0,
        1,
      );
    expect(formatOptions.mode).toBe('review_wrong');
    expect(formatOptions.groupFilter).toBeDefined();
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

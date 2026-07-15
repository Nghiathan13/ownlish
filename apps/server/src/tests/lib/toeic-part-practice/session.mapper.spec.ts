import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { ToeicPartPracticeSessionMapper } from './session.mapper';
import { ToeicPartPracticeRepository } from './repository';
import { TestsStorageService } from '../../tests-storage.service';
import {
  buildCatalogGroupForPartPractice,
  buildPartPracticeRunForResponse,
} from '../../testing/part-practice.fixtures';

describe('ToeicPartPracticeSessionMapper', () => {
  let mapper: ToeicPartPracticeSessionMapper;

  const storageMock = {
    createSignedUrls: jest.fn(),
  };
  const repositoryMock = {
    listFullQuestionGroupsForPart: jest.fn(),
    listAnswersForRun: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    storageMock.createSignedUrls.mockResolvedValue(new Map());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicPartPracticeSessionMapper,
        { provide: TestsStorageService, useValue: storageMock },
        { provide: ToeicPartPracticeRepository, useValue: repositoryMock },
      ],
    }).compile();

    mapper = module.get(ToeicPartPracticeSessionMapper);
  });

  it('formats catalog groups with test metadata and session question numbers', async () => {
    const session = buildPartPracticeRunForResponse({ partNumber: 1 });

    repositoryMock.listFullQuestionGroupsForPart.mockResolvedValue([
      buildCatalogGroupForPartPractice({
        id: 101,
        testId: 10,
        year: 2025,
        testNumber: 2,
        question: { id: 1001, questionNumber: 1, answerKey: 'A' },
      }),
      buildCatalogGroupForPartPractice({
        id: 102,
        testId: 11,
        year: 2026,
        testNumber: 1,
        questionStart: 2,
        questionEnd: 2,
        question: { id: 1002, questionNumber: 2, answerKey: 'B' },
      }),
    ]);
    repositoryMock.listAnswersForRun.mockResolvedValue([]);

    await expect(mapper.formatSessionResponse(session)).resolves.toMatchObject({
      sessionId: 'part-practice-run-id',
      mode: 'practice',
      partNumber: 1,
      totalQuestions: 2,
      groups: [
        {
          id: 101,
          testId: 10,
          year: 2025,
          testNumber: 2,
          partNumber: 1,
          questions: [{ sessionQuestionNumber: 1, selectedKey: null }],
        },
        {
          id: 102,
          testId: 11,
          year: 2026,
          testNumber: 1,
          questions: [{ id: 1002, sessionQuestionNumber: 2 }],
        },
      ],
    });
  });

  it('masks wrong questions in review_wrong while highlighting correct ones', async () => {
    const session = buildPartPracticeRunForResponse({
      partNumber: 1,
      totalRight: 1,
      totalWrong: 1,
    });

    repositoryMock.listFullQuestionGroupsForPart.mockResolvedValue([
      buildCatalogGroupForPartPractice({
        id: 101,
        question: { id: 1001, questionNumber: 1, answerKey: 'A' },
      }),
      buildCatalogGroupForPartPractice({
        id: 102,
        questionStart: 2,
        questionEnd: 2,
        question: { id: 1002, questionNumber: 2, answerKey: 'A' },
      }),
    ]);
    repositoryMock.listAnswersForRun.mockResolvedValue([
      {
        id: 'answer-1',
        runId: session.id,
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.RIGHT,
        answeredAt: new Date(),
        gradedAt: new Date(),
      },
      {
        id: 'answer-2',
        runId: session.id,
        toeicQuestionId: 1002,
        selectedKey: 'B',
        status: ToeicRunQuestionStatus.WRONG,
        answeredAt: new Date(),
        gradedAt: new Date(),
      },
    ]);

    await expect(
      mapper.formatSessionResponse(session, { mode: 'review_wrong' }),
    ).resolves.toMatchObject({
      mode: 'review_wrong',
      totalQuestions: 1,
      groups: [
        {
          id: 102,
          groupStatus: 'wrong',
          questions: [
            {
              id: 1002,
              selectedKey: null,
              status: null,
              isCorrect: null,
            },
          ],
        },
      ],
    });
  });
});

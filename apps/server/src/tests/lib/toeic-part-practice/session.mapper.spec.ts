import { Test, TestingModule } from '@nestjs/testing';
import {
  ToeicRunGroupStatus,
  ToeicRunQuestionStatus as QuestionStatus,
} from '@prisma/client';
import { isWrongReviewToeicGroup } from '../toeic-run/session.formatters';
import { ToeicPartPracticeSessionMapper } from './session.mapper';
import { TestsStorageService } from '../../tests-storage.service';
import {
  buildPartPracticePhotoRunGroup,
  buildPartPracticeRunForResponse,
} from '../../testing/part-practice.fixtures';

describe('ToeicPartPracticeSessionMapper', () => {
  let mapper: ToeicPartPracticeSessionMapper;

  const storageMock = {
    createSignedUrls: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    storageMock.createSignedUrls.mockResolvedValue(new Map());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicPartPracticeSessionMapper,
        { provide: TestsStorageService, useValue: storageMock },
      ],
    }).compile();

    mapper = module.get(ToeicPartPracticeSessionMapper);
  });

  it('formats groups with test metadata and session question numbers', async () => {
    const session = buildPartPracticeRunForResponse({
      groups: [
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 101,
          toeicTestId: 10,
          year: 2025,
          testNumber: 2,
          sortOrder: 0,
        }),
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 102,
          toeicTestId: 11,
          year: 2026,
          testNumber: 1,
          sortOrder: 1,
          question: { id: 1002, questionNumber: 2 } as never,
        }),
      ],
    });

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
          questions: [{ sessionQuestionNumber: 1 }],
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
      totalRight: 1,
      totalWrong: 1,
      questions: [
        {
          toeicQuestionId: 1001,
          selectedKey: 'A',
          status: QuestionStatus.RIGHT,
          toeicQuestion: { answerKey: 'A' },
        },
        {
          toeicQuestionId: 1002,
          selectedKey: 'B',
          status: QuestionStatus.WRONG,
          toeicQuestion: { answerKey: 'A' },
        },
      ],
      groups: [
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 101,
          status: ToeicRunGroupStatus.WRONG,
          answerStatus: QuestionStatus.RIGHT,
          selectedKey: 'A',
        }),
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 102,
          sortOrder: 1,
          question: { id: 1002, questionNumber: 2 } as never,
          answerStatus: QuestionStatus.WRONG,
          selectedKey: 'B',
        }),
      ],
    });

    await expect(
      mapper.formatSessionResponse(session, {
        mode: 'review_wrong',
        groupFilter: (group) => isWrongReviewToeicGroup(group),
      }),
    ).resolves.toMatchObject({
      mode: 'review_wrong',
      totalQuestions: 2,
      groups: [
        {
          id: 101,
          groupStatus: 'wrong',
          questions: [
            {
              id: 1001,
              selectedKey: 'A',
              status: 'right',
              isCorrect: true,
            },
          ],
        },
        {
          id: 102,
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

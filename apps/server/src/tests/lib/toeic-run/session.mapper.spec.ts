import { Test, TestingModule } from '@nestjs/testing';
import { isWrongReviewToeicGroup } from './session.formatters';
import { ToeicRunSessionMapper } from './session.mapper';
import { TestsStorageService } from '../../tests-storage.service';
import {
  buildPhotoRunGroup,
  buildToeicQuestion,
  buildToeicRunForResponse,
} from '../../testing/toeic-run.fixtures';
import { ToeicRunGroupStatus, ToeicRunQuestionStatus } from '@prisma/client';

describe('ToeicRunSessionMapper', () => {
  let mapper: ToeicRunSessionMapper;

  const storageMock = {
    createSignedUrls: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    storageMock.createSignedUrls.mockResolvedValue(
      new Map([
        [
          'audio/part-1.mp3',
          {
            url: 'https://storage.example/audio.mp3',
            expiresAt: '2026-06-18T00:00:00.000Z',
          },
        ],
      ]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunSessionMapper,
        { provide: TestsStorageService, useValue: storageMock },
      ],
    }).compile();

    mapper = module.get(ToeicRunSessionMapper);
  });

  it('formats a practice session with signed media and year', async () => {
    const session = buildToeicRunForResponse({
      id: 'run-id',
      selectedParts: [1, 2],
      groups: [
        buildPhotoRunGroup({
          toeicQuestionGroupId: 101,
          partNumber: 1,
          questionStart: 1,
          questionEnd: 1,
          sortOrder: 0,
        }),
        buildPhotoRunGroup({
          toeicQuestionGroupId: 102,
          partNumber: 2,
          questionStart: 2,
          questionEnd: 2,
          sortOrder: 1,
          question: buildToeicQuestion({ id: 1002, questionNumber: 2 }),
        }),
      ],
    });

    await expect(
      mapper.formatSessionResponse(session, [1], { year: 2026 }),
    ).resolves.toEqual({
      sessionId: 'run-id',
      mode: 'practice',
      testId: 1,
      year: 2026,
      partNumbers: [1],
      totalQuestions: 1,
      correctCount: 0,
      wrongCount: 0,
      completedAt: null,
      groups: [
        {
          id: 101,
          partNumber: 1,
          questionStart: 1,
          questionEnd: 1,
          groupStatus: null,
          groupType: 'photo',
          accent: null,
          content: 'Look at the picture.',
          contentVi: null,
          audioUrl: 'https://storage.example/audio.mp3',
          audioUrlExpiresAt: '2026-06-18T00:00:00.000Z',
          imageUrl: null,
          imageUrlExpiresAt: null,
          questions: [
            {
              id: 1001,
              questionNumber: 1,
              sessionQuestionNumber: 1,
              question: 'Question 1',
              questionVi: null,
              options: {
                A: 'A',
                B: 'B',
                C: 'C',
                D: 'D',
                A_vi: null,
                B_vi: null,
                C_vi: null,
                D_vi: null,
              },
              optionCount: 4,
              answerKey: 'A',
              selectedKey: null,
              status: null,
              isCorrect: null,
            },
          ],
        },
      ],
    });
  });

  it('filters review wrong groups and clears retry question state', async () => {
    const session = buildToeicRunForResponse({
      id: 'practice-run-id',
      totalRight: 1,
      totalWrong: 1,
      questions: [
        {
          toeicQuestionId: 1001,
          selectedKey: 'B',
          status: ToeicRunQuestionStatus.WRONG,
          toeicQuestion: { answerKey: 'A' },
        },
        {
          toeicQuestionId: 1002,
          selectedKey: 'C',
          status: ToeicRunQuestionStatus.RIGHT,
          toeicQuestion: { answerKey: 'C' },
        },
      ],
      groups: [
        buildPhotoRunGroup({
          toeicQuestionGroupId: 101,
          answerStatus: ToeicRunQuestionStatus.WRONG,
          selectedKey: 'B',
          status: ToeicRunGroupStatus.WRONG,
        }),
        buildPhotoRunGroup({
          toeicQuestionGroupId: 102,
          questionStart: 2,
          questionEnd: 2,
          sortOrder: 1,
          question: buildToeicQuestion({ id: 1002, questionNumber: 2 }),
          answerStatus: ToeicRunQuestionStatus.RIGHT,
          selectedKey: 'C',
          status: ToeicRunGroupStatus.RIGHT,
        }),
      ],
    });

    storageMock.createSignedUrls.mockResolvedValue(new Map());

    await expect(
      mapper.formatSessionResponse(session, [1], {
        year: 2025,
        mode: 'review_wrong',
        groupFilter: (group) => isWrongReviewToeicGroup(group),
      }),
    ).resolves.toMatchObject({
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
      year: 2025,
      totalQuestions: 1,
      correctCount: 1,
      wrongCount: 1,
      groups: [
        {
          id: 101,
          groupStatus: 'wrong',
          questions: [
            {
              id: 1001,
              sessionQuestionNumber: 1,
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

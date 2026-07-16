import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { TestsStorageService } from '../../tests-storage.service';
import {
  buildToeicQuestion,
  buildToeicRunForResponse,
} from '../../testing/toeic-run.fixtures';
import { ToeicRunRepository } from './repository';
import { ToeicRunSessionMapper } from './session.mapper';

describe('ToeicRunSessionMapper', () => {
  let mapper: ToeicRunSessionMapper;
  const storageMock = { createSignedUrls: jest.fn() };
  const repositoryMock = {
    listFullQuestionGroupsForParts: jest.fn(),
    listAnswersForRun: jest.fn(),
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
        { provide: ToeicRunRepository, useValue: repositoryMock },
      ],
    }).compile();

    mapper = module.get(ToeicRunSessionMapper);
  });

  it('builds a practice response from catalog data and persisted answers', async () => {
    repositoryMock.listFullQuestionGroupsForParts.mockResolvedValue([
      {
        id: 101,
        questionStart: 1,
        questionEnd: 1,
        groupType: 'photo',
        accent: null,
        content: 'Look at the picture.',
        contentVi: null,
        audioStoragePath: 'audio/part-1.mp3',
        imageStoragePath: null,
        testPart: { partNumber: 1 },
        questions: [buildToeicQuestion()],
      },
    ]);
    repositoryMock.listAnswersForRun.mockResolvedValue([]);

    await expect(
      mapper.formatSessionResponse(
        buildToeicRunForResponse({ id: 'run-id' }),
        [1],
        {
          year: 2026,
        },
      ),
    ).resolves.toMatchObject({
      sessionId: 'run-id',
      mode: 'practice',
      year: 2026,
      totalQuestions: 1,
      groups: [
        {
          id: 101,
          groupStatus: null,
          audioUrl: 'https://storage.example/audio.mp3',
          questions: [
            { id: 1001, selectedKey: null, status: null, isCorrect: null },
          ],
        },
      ],
    });
    expect(repositoryMock.listFullQuestionGroupsForParts).toHaveBeenCalledWith(
      1,
      [1],
    );
  });

  it('filters review wrong by persisted answers and clears their local retry state', async () => {
    repositoryMock.listFullQuestionGroupsForParts.mockResolvedValue([
      {
        id: 101,
        questionStart: 1,
        questionEnd: 1,
        groupType: 'photo',
        accent: null,
        content: null,
        contentVi: null,
        audioStoragePath: null,
        imageStoragePath: null,
        testPart: { partNumber: 1 },
        questions: [buildToeicQuestion({ id: 1001 })],
      },
      {
        id: 102,
        questionStart: 2,
        questionEnd: 2,
        groupType: 'photo',
        accent: null,
        content: null,
        contentVi: null,
        audioStoragePath: null,
        imageStoragePath: null,
        testPart: { partNumber: 1 },
        questions: [buildToeicQuestion({ id: 1002, questionNumber: 2 })],
      },
    ]);
    repositoryMock.listAnswersForRun.mockResolvedValue([
      {
        toeicQuestionId: 1001,
        selectedKey: 'B',
        status: ToeicRunQuestionStatus.WRONG,
      },
      {
        toeicQuestionId: 1002,
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.RIGHT,
      },
    ]);
    storageMock.createSignedUrls.mockResolvedValue(new Map());

    await expect(
      mapper.formatSessionResponse(
        buildToeicRunForResponse({ totalRight: 1, totalWrong: 1 }),
        [1],
        { year: 2026, mode: 'review_wrong' },
      ),
    ).resolves.toMatchObject({
      mode: 'review_wrong',
      totalQuestions: 1,
      groups: [
        {
          id: 101,
          groupStatus: 'wrong',
          questions: [{ selectedKey: null, status: null, isCorrect: null }],
        },
      ],
    });
  });
});

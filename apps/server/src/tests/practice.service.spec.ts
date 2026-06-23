import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PracticeService } from './practice.service';
import { TestsStorageService } from './tests-storage.service';

describe('PracticeService', () => {
  let service: PracticeService;

  const prismaMock = {
    toeicTest: {
      findUnique: jest.fn(),
    },
    toeicTestPart: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    toeicRun: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    toeicRunQuestion: {
      count: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    toeicRunGroup: {
      create: jest.fn(),
      update: jest.fn(),
    },
    toeicQuestion: {
      findUnique: jest.fn(),
    },
    toeicQuestionGroup: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
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
        PracticeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: TestsStorageService,
          useValue: storageMock,
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
  });

  it('reuses the latest practice run for the test when selected parts change', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([
      { partNumber: 1 },
      { partNumber: 2 },
    ]);
    prismaMock.toeicRun.findFirst.mockResolvedValue({ id: 'run-id' });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique
      .mockResolvedValueOnce({
        id: 'run-id',
        selectedParts: [1],
        groups: [],
      })
      .mockResolvedValueOnce({
        id: 'run-id',
        mode: 'PRACTICE',
        toeicTestId: 1,
        selectedParts: [1, 2],
        totalRight: 0,
        totalWrong: 0,
        completedAt: null,
        questions: [],
        groups: [
          {
            toeicQuestionGroupId: 101,
            partNumber: 1,
            questionStart: 1,
            questionEnd: 1,
            sortOrder: 0,
            toeicQuestionGroup: {
              id: 101,
              groupType: 'photo',
              accent: null,
              content: 'Look at the picture.',
              contentVi: null,
              audioStoragePath: 'audio/part-1.mp3',
              imageStoragePath: null,
            },
            questions: [
              {
                toeicQuestionId: 1001,
                selectedKey: null,
                status: null,
                toeicQuestion: {
                  id: 1001,
                  groupId: 101,
                  questionNumber: 1,
                  question: 'Question 1',
                  questionVi: null,
                  questionType: null,
                  optionA: 'A',
                  optionB: 'B',
                  optionC: 'C',
                  optionD: 'D',
                  optionAVi: null,
                  optionBVi: null,
                  optionCVi: null,
                  optionDVi: null,
                  answerKey: 'A',
                  explanationVi: null,
                  createdAt: new Date('2026-06-01T00:00:00.000Z'),
                  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
                },
              },
            ],
          },
        ],
      });
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([]);
    prismaMock.toeicRun.update.mockResolvedValue({ id: 'run-id' });

    await expect(
      service.createRun('user-id', { testId: 1, partNumbers: [1, 2] }),
    ).resolves.toEqual({
      sessionId: 'run-id',
      mode: 'practice',
      testId: 1,
      partNumbers: [1, 2],
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

    expect(prismaMock.toeicRun.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        toeicTestId: 1,
        mode: 'PRACTICE',
      },
      orderBy: { createdAt: 'desc' },
      include: expect.any(Object) as unknown,
    });
    expect(prismaMock.toeicRun.create).not.toHaveBeenCalled();
    expect(prismaMock.toeicRun.update).toHaveBeenCalledWith({
      where: { id: 'run-id' },
      data: { selectedParts: [1, 2] },
    });
  });

  it('uses the latest practice run as a filtered review wrong session', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([{ partNumber: 1 }]);
    prismaMock.toeicRun.findFirst.mockResolvedValue({ id: 'practice-run-id' });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique
      .mockResolvedValueOnce({
        id: 'practice-run-id',
        selectedParts: [1],
        groups: [
          {
            toeicQuestionGroupId: 101,
            partNumber: 1,
            sortOrder: 0,
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'practice-run-id',
        mode: 'PRACTICE',
        toeicTestId: 1,
        selectedParts: [1],
        totalRight: 1,
        totalWrong: 1,
        completedAt: null,
        questions: [
          {
            toeicQuestionId: 1001,
            selectedKey: 'B',
            status: 'WRONG',
            toeicQuestion: { answerKey: 'A' },
          },
          {
            toeicQuestionId: 1002,
            selectedKey: 'C',
            status: 'RIGHT',
            toeicQuestion: { answerKey: 'C' },
          },
        ],
        groups: [
          {
            toeicQuestionGroupId: 101,
            partNumber: 1,
            questionStart: 1,
            questionEnd: 1,
            sortOrder: 0,
            status: 'WRONG',
            toeicQuestionGroup: {
              id: 101,
              groupType: 'photo',
              accent: null,
              content: null,
              contentVi: null,
              audioStoragePath: null,
              imageStoragePath: null,
            },
            questions: [
              {
                toeicQuestionId: 1001,
                selectedKey: 'B',
                status: 'WRONG',
                toeicQuestion: {
                  id: 1001,
                  groupId: 101,
                  questionNumber: 1,
                  question: 'Question 1',
                  questionVi: null,
                  questionType: null,
                  optionA: 'A',
                  optionB: 'B',
                  optionC: 'C',
                  optionD: 'D',
                  optionAVi: null,
                  optionBVi: null,
                  optionCVi: null,
                  optionDVi: null,
                  answerKey: 'A',
                  explanationVi: null,
                  createdAt: new Date('2026-06-01T00:00:00.000Z'),
                  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
                },
              },
            ],
          },
          {
            toeicQuestionGroupId: 102,
            partNumber: 1,
            questionStart: 2,
            questionEnd: 2,
            sortOrder: 1,
            status: 'RIGHT',
            toeicQuestionGroup: {
              id: 102,
              groupType: 'photo',
              accent: null,
              content: null,
              contentVi: null,
              audioStoragePath: null,
              imageStoragePath: null,
            },
            questions: [
              {
                toeicQuestionId: 1002,
                selectedKey: 'C',
                status: 'RIGHT',
                toeicQuestion: {
                  id: 1002,
                  groupId: 102,
                  questionNumber: 2,
                  question: 'Question 2',
                  questionVi: null,
                  questionType: null,
                  optionA: 'A',
                  optionB: 'B',
                  optionC: 'C',
                  optionD: 'D',
                  optionAVi: null,
                  optionBVi: null,
                  optionCVi: null,
                  optionDVi: null,
                  answerKey: 'C',
                  explanationVi: null,
                  createdAt: new Date('2026-06-01T00:00:00.000Z'),
                  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
                },
              },
            ],
          },
        ],
      });
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([]);

    await expect(
      service.createRun('user-id', {
        testId: 1,
        partNumbers: [1],
        mode: 'review_wrong',
      }),
    ).resolves.toMatchObject({
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
      testId: 1,
      partNumbers: [1],
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

    expect(prismaMock.toeicRun.create).not.toHaveBeenCalled();
  });

  it('creates an empty practice run when review wrong has no practice session', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([{ partNumber: 1 }]);
    prismaMock.toeicRun.findFirst.mockResolvedValue(null);
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([]);
    prismaMock.toeicRun.create.mockResolvedValue({ id: 'practice-run-id' });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique.mockResolvedValue({
      id: 'practice-run-id',
      mode: 'PRACTICE',
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
      questions: [],
      groups: [],
    });

    await expect(
      service.createRun('user-id', {
        testId: 1,
        partNumbers: [1],
        mode: 'review_wrong',
      }),
    ).resolves.toMatchObject({
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
      totalQuestions: 0,
      groups: [],
    });

    expect(prismaMock.toeicRun.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        toeicTestId: 1,
        mode: 'PRACTICE',
        selectedParts: [1],
      },
    });
  });

  it('creates a new mock test run every time', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([{ partNumber: 1 }]);
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([]);
    prismaMock.toeicRun.create.mockResolvedValue({ id: 'mock-run-id' });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique.mockResolvedValue({
      id: 'mock-run-id',
      mode: 'MOCK_TEST',
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
      questions: [],
      groups: [],
    });

    await expect(
      service.createRun('user-id', {
        testId: 1,
        partNumbers: [1],
        mode: 'mock_test',
      }),
    ).resolves.toMatchObject({
      sessionId: 'mock-run-id',
      mode: 'mock_test',
      completedAt: null,
    });

    expect(prismaMock.toeicRun.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.toeicRun.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        toeicTestId: 1,
        mode: 'MOCK_TEST',
        selectedParts: [1],
      },
    });
  });

  it('stores mock answers as selected without grading', async () => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1 } },
    };
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'mock-run-id',
      userId: 'user-id',
      toeicTestId: 1,
      mode: 'MOCK_TEST',
      selectedParts: [1],
      completedAt: null,
    });
    prismaMock.toeicQuestion.findUnique.mockResolvedValue(question);
    prismaMock.toeicRunQuestion.findUnique.mockResolvedValue({
      id: 'run-question-id',
      runId: 'mock-run-id',
      runGroupId: 'run-group-id',
      toeicQuestionId: 1001,
      partNumber: 1,
      selectedKey: null,
      status: null,
      toeicQuestion: question,
    });

    await expect(
      service.submitAnswer('user-id', 'mock-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
      }),
    ).resolves.toEqual({ graded: false });

    expect(prismaMock.toeicRunQuestion.update).toHaveBeenCalledWith({
      where: { id: 'run-question-id' },
      data: {
        selectedKey: 'B',
        status: 'SELECTED',
        answeredAt: expect.any(Date) as Date,
      },
    });
    expect(prismaMock.toeicRunQuestion.count).not.toHaveBeenCalled();
  });

  it('does not grade a review wrong group until every non-right question is selected again', async () => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1 } },
    };
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'practice-run-id',
      userId: 'user-id',
      toeicTestId: 1,
      mode: 'PRACTICE',
      selectedParts: [3],
      completedAt: null,
    });
    prismaMock.toeicQuestion.findUnique.mockResolvedValue(question);
    prismaMock.toeicRunQuestion.findUnique.mockResolvedValue({
      id: 'run-question-id',
      runId: 'practice-run-id',
      runGroupId: 'run-group-id',
      toeicQuestionId: 1001,
      partNumber: 3,
      selectedKey: 'B',
      status: 'WRONG',
      toeicQuestion: question,
    });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRunQuestion.findMany.mockResolvedValue([
      { selectedKey: 'A', status: 'SELECTED' },
      { selectedKey: 'D', status: 'WRONG' },
    ]);

    await expect(
      service.submitAnswer('user-id', 'practice-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
        mode: 'review_wrong',
      }),
    ).resolves.toEqual({ graded: false });

    expect(prismaMock.toeicRunQuestion.update).toHaveBeenCalledWith({
      where: { id: 'run-question-id' },
      data: {
        selectedKey: 'A',
        status: 'SELECTED',
        answeredAt: expect.any(Date) as Date,
      },
    });
    expect(prismaMock.toeicRunQuestion.count).not.toHaveBeenCalled();
  });

  it('rejects mock answer submissions after finish', async () => {
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'mock-run-id',
      userId: 'user-id',
      toeicTestId: 1,
      mode: 'MOCK_TEST',
      selectedParts: [1],
      completedAt: new Date('2026-06-21T00:00:00.000Z'),
    });

    await expect(
      service.submitAnswer('user-id', 'mock-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
      }),
    ).rejects.toThrow('TOEIC run is already completed.');
  });

  it('finishes mock runs by grading selected answers and marking unanswered as wrong', async () => {
    const completedAt = new Date('2026-06-21T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(completedAt);
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'mock-run-id',
      userId: 'user-id',
      toeicTestId: 1,
      mode: 'MOCK_TEST',
      selectedParts: [1],
      completedAt: null,
    });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRunQuestion.findMany
      .mockResolvedValueOnce([
        {
          id: 'selected-question-id',
          runId: 'mock-run-id',
          runGroupId: 'run-group-id',
          toeicQuestionId: 1001,
          selectedKey: 'B',
          answeredAt: new Date('2026-06-20T00:00:00.000Z'),
          toeicQuestion: { answerKey: 'A' },
        },
        {
          id: 'unanswered-question-id',
          runId: 'mock-run-id',
          runGroupId: 'run-group-id',
          toeicQuestionId: 1002,
          selectedKey: null,
          answeredAt: null,
          toeicQuestion: { answerKey: 'C' },
        },
      ])
      .mockResolvedValueOnce([{ status: 'WRONG' }, { status: 'WRONG' }]);
    prismaMock.toeicRunQuestion.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);
    prismaMock.toeicRun.findUnique.mockResolvedValue({
      id: 'mock-run-id',
      mode: 'MOCK_TEST',
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 2,
      completedAt,
      questions: [],
      groups: [],
    });

    await expect(service.finishRun('user-id', 'mock-run-id')).resolves.toEqual({
      sessionId: 'mock-run-id',
      mode: 'mock_test',
      testId: 1,
      partNumbers: [1],
      totalQuestions: 0,
      correctCount: 0,
      wrongCount: 2,
      completedAt: completedAt.toISOString(),
      groups: [],
    });

    expect(prismaMock.toeicRunQuestion.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.toeicRunQuestion.update).toHaveBeenCalledWith({
      where: { id: 'selected-question-id' },
      data: {
        selectedKey: 'B',
        status: 'WRONG',
        answeredAt: new Date('2026-06-20T00:00:00.000Z'),
        gradedAt: completedAt,
      },
    });
    expect(prismaMock.toeicRunQuestion.update).toHaveBeenCalledWith({
      where: { id: 'unanswered-question-id' },
      data: {
        status: 'WRONG',
        gradedAt: completedAt,
      },
    });
    expect(prismaMock.toeicRunGroup.update).toHaveBeenCalledWith({
      where: { id: 'run-group-id' },
      data: { status: 'WRONG' },
    });
    expect(prismaMock.toeicRun.update).toHaveBeenCalledWith({
      where: { id: 'mock-run-id' },
      data: { completedAt },
    });
    jest.useRealTimers();
  });

  it('clears practice runs for a test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicRun.deleteMany.mockReturnValue('delete-runs-query');
    prismaMock.$transaction.mockResolvedValue([{ count: 2 }]);

    await expect(service.clearTestHistory('user-id', 1)).resolves.toEqual({
      deletedSessionCount: 2,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(['delete-runs-query']);
  });

  it('getRun filters visible parts on a practice session', async () => {
    const practiceRun = {
      id: 'practice-run-id',
      mode: 'PRACTICE',
      toeicTestId: 1,
      selectedParts: [1, 2, 3],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
      questions: [],
      groups: [
        {
          toeicQuestionGroupId: 101,
          partNumber: 1,
          questionStart: 1,
          questionEnd: 1,
          sortOrder: 0,
          status: null,
          toeicQuestionGroup: {
            id: 101,
            groupType: 'photo',
            accent: null,
            content: null,
            contentVi: null,
            audioStoragePath: null,
            imageStoragePath: null,
          },
          questions: [],
        },
        {
          toeicQuestionGroupId: 102,
          partNumber: 2,
          questionStart: 2,
          questionEnd: 2,
          sortOrder: 1,
          status: null,
          toeicQuestionGroup: {
            id: 102,
            groupType: 'photo',
            accent: null,
            content: null,
            contentVi: null,
            audioStoragePath: null,
            imageStoragePath: null,
          },
          questions: [],
        },
      ],
    };

    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1, year: 2026 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([
      { partNumber: 1 },
      { partNumber: 2 },
      { partNumber: 3 },
    ]);
    prismaMock.toeicRun.findFirst.mockResolvedValue(practiceRun);
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique
      .mockResolvedValueOnce({
        id: 'practice-run-id',
        selectedParts: [1, 2, 3],
        groups: [],
      })
      .mockResolvedValueOnce(practiceRun);

    await expect(
      service.getRun('user-id', 'practice-run-id', { parts: '1' }),
    ).resolves.toMatchObject({
      sessionId: 'practice-run-id',
      year: 2026,
      partNumbers: [1],
      groups: [{ partNumber: 1 }],
    });
  });

  it('getRun returns review wrong view over the shared practice session', async () => {
    const practiceRun = {
      id: 'practice-run-id',
      mode: 'PRACTICE',
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 1,
      totalWrong: 1,
      completedAt: null,
      questions: [
        {
          toeicQuestionId: 1001,
          selectedKey: 'B',
          status: 'WRONG',
          toeicQuestion: { answerKey: 'A' },
        },
      ],
      groups: [
        {
          toeicQuestionGroupId: 101,
          partNumber: 1,
          questionStart: 1,
          questionEnd: 1,
          sortOrder: 0,
          status: 'WRONG',
          toeicQuestionGroup: {
            id: 101,
            groupType: 'photo',
            accent: null,
            content: null,
            contentVi: null,
            audioStoragePath: null,
            imageStoragePath: null,
          },
          questions: [
            {
              toeicQuestionId: 1001,
              selectedKey: 'B',
              status: 'WRONG',
              toeicQuestion: {
                id: 1001,
                groupId: 101,
                questionNumber: 1,
                question: 'Question 1',
                questionVi: null,
                questionType: null,
                optionA: 'A',
                optionB: 'B',
                optionC: 'C',
                optionD: 'D',
                optionAVi: null,
                optionBVi: null,
                optionCVi: null,
                optionDVi: null,
                answerKey: 'A',
                explanationVi: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
        },
      ],
    };

    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1, year: 2025 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([{ partNumber: 1 }]);
    prismaMock.toeicRun.findFirst.mockResolvedValue(practiceRun);
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique
      .mockResolvedValueOnce({
        id: 'practice-run-id',
        selectedParts: [1],
        groups: [],
      })
      .mockResolvedValueOnce(practiceRun);

    await expect(
      service.getRun('user-id', 'practice-run-id', {
        parts: '1',
        mode: 'review_wrong',
      }),
    ).resolves.toMatchObject({
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
      year: 2025,
      groups: [
        {
          partNumber: 1,
          questions: [{ id: 1001, selectedKey: null }],
        },
      ],
    });
  });

  it('getRun expands practice sessions when new parts are requested', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1, year: 2026 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([
      { partNumber: 1 },
      { partNumber: 2 },
    ]);
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'practice-run-id',
      mode: 'PRACTICE',
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
      questions: [],
      groups: [],
    });
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    prismaMock.toeicRun.findUnique
      .mockResolvedValueOnce({
        id: 'practice-run-id',
        selectedParts: [1],
        groups: [],
      })
      .mockResolvedValueOnce({
        id: 'practice-run-id',
        mode: 'PRACTICE',
        toeicTestId: 1,
        selectedParts: [1, 2],
        totalRight: 0,
        totalWrong: 0,
        completedAt: null,
        questions: [],
        groups: [],
      });

    await expect(
      service.getRun('user-id', 'practice-run-id', { parts: '1,2' }),
    ).resolves.toMatchObject({
      sessionId: 'practice-run-id',
      partNumbers: [1, 2],
      year: 2026,
    });

    expect(prismaMock.toeicRun.update).toHaveBeenCalledWith({
      where: { id: 'practice-run-id' },
      data: { selectedParts: [1, 2] },
    });
  });

  it('getRun rejects review wrong mode for mock sessions', async () => {
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'mock-run-id',
      mode: 'MOCK_TEST',
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
      questions: [],
      groups: [],
    });

    await expect(
      service.getRun('user-id', 'mock-run-id', {
        parts: '1',
        mode: 'review_wrong',
      }),
    ).rejects.toThrow('Review wrong is not supported for mock test runs.');
  });
});

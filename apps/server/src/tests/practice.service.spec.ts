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
    },
    toeicRunGroup: {
      create: jest.fn(),
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
      service.createSession('user-id', { testId: 1, partNumbers: [1, 2] }),
    ).resolves.toEqual({
      sessionId: 'run-id',
      mode: 'practice',
      testId: 1,
      partNumbers: [1, 2],
      correctCount: 0,
      wrongCount: 0,
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

  it('clears practice runs for a test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicRun.deleteMany.mockReturnValue('delete-runs-query');
    prismaMock.$transaction.mockResolvedValue([{ count: 2 }]);

    await expect(service.clearTestHistory('user-id', 1)).resolves.toEqual({
      deletedSessionCount: 2,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(['delete-runs-query']);
  });
});

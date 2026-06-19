import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PracticeService } from './practice.service';

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
    toeicWrongQuestion: {
      deleteMany: jest.fn(),
    },
    toeicPracticeSession: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
  });

  it('lists wrong questions for the latest practice run in a test part', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue({
      id: 1,
      testId: 1,
      partNumber: 1,
    });
    prismaMock.toeicRun.findFirst.mockResolvedValue({ id: 'run-id' });
    prismaMock.toeicRunQuestion.findMany.mockResolvedValue([
      {
        toeicQuestionId: 10,
        status: ToeicRunQuestionStatus.WRONG,
        answeredAt: new Date('2026-06-01T00:00:00.000Z'),
        gradedAt: new Date('2026-06-01T00:01:00.000Z'),
        toeicQuestion: {
          id: 10,
          questionNumber: 3,
        },
      },
    ]);

    await expect(service.listWrongQuestions('user-id', 1, 1)).resolves.toEqual({
      items: [
        {
          toeicQuestionId: 10,
          questionNumber: 3,
          wrongCount: 1,
          lastWrongAt: '2026-06-01T00:01:00.000Z',
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
      select: { id: true },
    });
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
        totalRight: 0,
        totalWrong: 0,
        questions: [],
      });
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([]);
    prismaMock.toeicRun.update.mockResolvedValue({ id: 'run-id' });

    await expect(
      service.createSession('user-id', { testId: 1, partNumbers: [1, 2] }),
    ).resolves.toEqual({
      sessionId: 'run-id',
      correctCount: 0,
      wrongCount: 0,
      answers: [],
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

  it('throws when listing wrong questions for a missing part', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue(null);

    await expect(
      service.listWrongQuestions('user-id', 1, 9),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears practice runs, legacy sessions, and wrong questions for a test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicRun.deleteMany.mockReturnValue('delete-runs-query');
    prismaMock.toeicPracticeSession.deleteMany.mockReturnValue(
      'delete-legacy-sessions-query',
    );
    prismaMock.toeicWrongQuestion.deleteMany.mockReturnValue(
      'delete-legacy-wrong-questions-query',
    );
    prismaMock.$transaction.mockResolvedValue([
      { count: 2 },
      { count: 1 },
      { count: 4 },
    ]);

    await expect(service.clearTestHistory('user-id', 1)).resolves.toEqual({
      deletedSessionCount: 3,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith([
      'delete-runs-query',
      'delete-legacy-sessions-query',
      'delete-legacy-wrong-questions-query',
    ]);
  });
});

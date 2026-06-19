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
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    toeicRunQuestion: {
      count: jest.fn(),
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
        selectedParts: { has: 1 },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  });

  it('throws when listing wrong questions for a missing part', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue(null);

    await expect(
      service.listWrongQuestions('user-id', 1, 9),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns aggregated practice stats from the latest practice run per part', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([
      { partNumber: 1 },
      { partNumber: 2 },
    ]);
    prismaMock.toeicRun.findFirst
      .mockResolvedValueOnce({ id: 'part-1-run' })
      .mockResolvedValueOnce({ id: 'part-2-run' });
    prismaMock.toeicRunQuestion.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await expect(service.getPracticeStats('user-id', 1)).resolves.toEqual({
      testId: 1,
      wrongQuestionCount: 3,
      practiceCorrectCount: 4,
      practiceWrongCount: 3,
      parts: [
        {
          partNumber: 1,
          wrongQuestionCount: 2,
          practiceCorrectCount: 4,
          practiceWrongCount: 2,
        },
        {
          partNumber: 2,
          wrongQuestionCount: 1,
          practiceCorrectCount: 0,
          practiceWrongCount: 1,
        },
      ],
    });
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

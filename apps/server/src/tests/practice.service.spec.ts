import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
    toeicWrongQuestion: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    toeicPracticeSession: {
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
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

  it('lists wrong questions for a test part', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue({
      id: 1,
      testId: 1,
      partNumber: 1,
    });
    prismaMock.toeicWrongQuestion.findMany.mockResolvedValue([
      {
        toeicQuestionId: 10,
        wrongCount: 2,
        lastWrongAt: new Date('2026-06-01T00:00:00.000Z'),
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
          wrongCount: 2,
          lastWrongAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('throws when listing wrong questions for a missing part', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue(null);

    await expect(
      service.listWrongQuestions('user-id', 1, 9),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns aggregated practice stats for a test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([
      { partNumber: 1 },
      { partNumber: 2 },
    ]);
    prismaMock.toeicWrongQuestion.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prismaMock.toeicPracticeSession.aggregate
      .mockResolvedValueOnce({
        _sum: { correctCount: 4, wrongCount: 1 },
      })
      .mockResolvedValueOnce({
        _sum: { correctCount: 0, wrongCount: 3 },
      });

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

  it('clears practice sessions and wrong questions for a test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.$transaction.mockResolvedValue([{ count: 2 }]);

    await expect(service.clearTestHistory('user-id', 1)).resolves.toEqual({
      deletedSessionCount: 2,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});

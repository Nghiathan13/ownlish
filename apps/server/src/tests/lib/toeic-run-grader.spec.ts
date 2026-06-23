import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ToeicRunGrader } from './toeic-run-grader';

describe('ToeicRunGrader', () => {
  let grader: ToeicRunGrader;

  const prismaMock = {
    toeicRun: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    toeicQuestion: {
      findUnique: jest.fn(),
    },
    toeicRunQuestion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    toeicRunGroup: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunGrader,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    grader = module.get(ToeicRunGrader);
  });

  it('stores mock answers as selected without grading', async () => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1 } },
    };
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'mock-run-id',
      toeicTestId: 1,
      mode: 'MOCK_TEST',
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
      grader.submitAnswer('user-id', 'mock-run-id', {
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
});

import { Test, TestingModule } from '@nestjs/testing';
import { ToeicPartPracticeGrader } from './grader';
import { ToeicPartPracticeRepository } from './repository';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  createToeicTestsPrismaMock,
  useToeicTestsTransaction,
} from '../../testing/create-toeic-tests-prisma.mock';

function createPartPracticePrismaMock() {
  const base = createToeicTestsPrismaMock();
  return {
    ...base,
    toeicPartPracticeRun: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    toeicPartPracticeQuestion: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    toeicPartPracticeGroup: {
      update: jest.fn(),
    },
  };
}

describe('ToeicPartPracticeGrader', () => {
  let grader: ToeicPartPracticeGrader;
  const prismaMock = createPartPracticePrismaMock();
  const mockGradedPartPracticeQuestion = (
    status: 'RIGHT' | 'WRONG',
    selectedKey: 'A' | 'B',
  ) => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1, partNumber: 1 } },
    };
    prismaMock.toeicPartPracticeRun.findFirst.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    prismaMock.toeicQuestion.findUnique.mockResolvedValue(question);
    prismaMock.toeicPartPracticeQuestion.findUnique.mockResolvedValue({
      id: 'run-question-id',
      runId: 'part-run-id',
      runGroupId: 'run-group-id',
      toeicQuestionId: 1001,
      partNumber: 1,
      selectedKey,
      status,
      toeicQuestion: question,
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    useToeicTestsTransaction(prismaMock);
    prismaMock.$queryRaw.mockResolvedValue([{ id: 'part-run-id' }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicPartPracticeGrader,
        ToeicPartPracticeRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    grader = module.get(ToeicPartPracticeGrader);
  });

  it('grades a group when every question in the group is selected', async () => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1, partNumber: 1 } },
    };
    prismaMock.toeicPartPracticeRun.findFirst.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    prismaMock.toeicQuestion.findUnique.mockResolvedValue(question);
    prismaMock.toeicPartPracticeQuestion.findUnique.mockResolvedValue({
      id: 'run-question-id',
      runId: 'part-run-id',
      runGroupId: 'run-group-id',
      toeicQuestionId: 1001,
      partNumber: 1,
      selectedKey: null,
      status: null,
      toeicQuestion: question,
    });
    prismaMock.toeicPartPracticeQuestion.findMany
      .mockResolvedValueOnce([{ selectedKey: 'A', status: 'SELECTED' }])
      .mockResolvedValueOnce([
        {
          id: 'run-question-id',
          runGroupId: 'run-group-id',
          status: 'SELECTED',
          selectedKey: 'A',
          toeicQuestion: question,
        },
      ])
      .mockResolvedValueOnce([{ status: 'RIGHT' }]);
    prismaMock.toeicPartPracticeQuestion.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).resolves.toMatchObject({
      graded: true,
      isCorrect: true,
      answerKey: 'A',
    });
  });

  it('returns graded false when the group is not ready', async () => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1, partNumber: 1 } },
    };
    prismaMock.toeicPartPracticeRun.findFirst.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    prismaMock.toeicQuestion.findUnique.mockResolvedValue(question);
    prismaMock.toeicPartPracticeQuestion.findUnique.mockResolvedValue({
      id: 'run-question-id',
      runId: 'part-run-id',
      runGroupId: 'run-group-id',
      toeicQuestionId: 1001,
      partNumber: 1,
      selectedKey: null,
      status: null,
      toeicQuestion: question,
    });
    prismaMock.toeicPartPracticeQuestion.findMany.mockResolvedValue([
      { selectedKey: 'A', status: 'SELECTED' },
      { selectedKey: null, status: null },
    ]);

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).resolves.toEqual({ graded: false });
  });

  it.each([
    ['RIGHT', 'A', true],
    ['WRONG', 'B', false],
  ] as const)(
    'treats the same %s answer as an idempotent retry',
    async (status, selectedKey, isCorrect) => {
      mockGradedPartPracticeQuestion(status, selectedKey);

      await expect(
        grader.submitAnswer('user-id', 'part-run-id', {
          toeicQuestionId: 1001,
          selectedKey,
        }),
      ).resolves.toMatchObject({ graded: true, isCorrect });

      expect(
        prismaMock.toeicPartPracticeQuestion.update,
      ).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['RIGHT', 'A', 'B'],
    ['WRONG', 'B', 'A'],
  ] as const)(
    'rejects changing an already %s answer',
    async (status, previousSelectedKey, selectedKey) => {
      mockGradedPartPracticeQuestion(status, previousSelectedKey);

      await expect(
        grader.submitAnswer('user-id', 'part-run-id', {
          toeicQuestionId: 1001,
          selectedKey,
        }),
      ).rejects.toThrow('Graded answers cannot be changed.');

      expect(
        prismaMock.toeicPartPracticeQuestion.update,
      ).not.toHaveBeenCalled();
    },
  );

  it('allows review wrong to replace a wrong answer', async () => {
    mockGradedPartPracticeQuestion('WRONG', 'B');
    prismaMock.toeicPartPracticeQuestion.findMany.mockResolvedValue([
      { selectedKey: 'A', status: 'SELECTED' },
      { selectedKey: 'D', status: 'WRONG' },
    ]);

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
        mode: 'review_wrong',
      }),
    ).resolves.toEqual({ graded: false });

    expect(prismaMock.toeicPartPracticeQuestion.update).toHaveBeenCalledWith({
      where: { id: 'run-question-id' },
      data: {
        selectedKey: 'A',
        status: 'SELECTED',
        answeredAt: expect.any(Date) as Date,
      },
    });
  });

  it('keeps right answers locked in review wrong mode', async () => {
    mockGradedPartPracticeQuestion('RIGHT', 'A');

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
        mode: 'review_wrong',
      }),
    ).rejects.toThrow('Graded answers cannot be changed.');

    expect(prismaMock.toeicPartPracticeQuestion.update).not.toHaveBeenCalled();
    expect(prismaMock.toeicPartPracticeGroup.update).not.toHaveBeenCalled();
    expect(prismaMock.toeicPartPracticeRun.update).not.toHaveBeenCalled();
  });
});

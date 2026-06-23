import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { ToeicRunGrader } from './grader';
import { ToeicRunRepository } from './repository';
import {
  createToeicTestsPrismaMock,
  useToeicTestsTransaction,
} from '../../testing/create-toeic-tests-prisma.mock';

describe('ToeicRunGrader', () => {
  let grader: ToeicRunGrader;

  const prismaMock = createToeicTestsPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    useToeicTestsTransaction(prismaMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunGrader,
        ToeicRunRepository,
        { provide: PrismaService, useValue: prismaMock },
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

  it('does not grade a review wrong group until every non-right question is selected again', async () => {
    const question = {
      id: 1001,
      answerKey: 'A',
      group: { testPart: { testId: 1 } },
    };
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'practice-run-id',
      toeicTestId: 1,
      mode: 'PRACTICE',
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
    prismaMock.toeicRunQuestion.findMany.mockResolvedValue([
      { selectedKey: 'A', status: 'SELECTED' },
      { selectedKey: 'D', status: 'WRONG' },
    ]);

    await expect(
      grader.submitAnswer('user-id', 'practice-run-id', {
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
      toeicTestId: 1,
      mode: 'MOCK_TEST',
      completedAt: new Date('2026-06-21T00:00:00.000Z'),
    });

    await expect(
      grader.submitAnswer('user-id', 'mock-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
      }),
    ).rejects.toThrow('TOEIC run is already completed.');
  });

  it('completes mock runs by grading selected answers and marking unanswered as wrong', async () => {
    const completedAt = new Date('2026-06-21T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(completedAt);
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

    await grader.completeMockRun('mock-run-id');

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
});

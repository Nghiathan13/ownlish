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
  const question = {
    id: 1001,
    answerKey: 'A',
    group: { id: 101, testPart: { testId: 1, partNumber: 1 } },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    useToeicTestsTransaction(prismaMock);
    prismaMock.$queryRaw.mockResolvedValue([
      { id: 'run-id', completedAt: null },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunGrader,
        ToeicRunRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    grader = module.get(ToeicRunGrader);
  });

  function mockOpenRun(mode: 'PRACTICE' | 'MOCK_TEST' = 'PRACTICE') {
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'run-id',
      toeicTestId: 1,
      mode,
      selectedParts: [1],
      completedAt: null,
    });
    prismaMock.toeicQuestion.findUnique.mockResolvedValue(question);
  }

  it('creates one selected answer for a mock answer without grading', async () => {
    mockOpenRun('MOCK_TEST');
    prismaMock.toeicRunAnswer.findUnique.mockResolvedValue(null);

    await expect(
      grader.submitAnswer('user-id', 'run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
      }),
    ).resolves.toEqual({ graded: false });

    const createCalls = prismaMock.toeicRunAnswer.create.mock
      .calls as unknown as Array<
      [
        {
          data: {
            runId: string;
            toeicQuestionId: number;
            selectedKey: string;
            status: string;
          };
        },
      ]
    >;
    expect(createCalls[0]?.[0].data).toMatchObject({
      runId: 'run-id',
      toeicQuestionId: 1001,
      selectedKey: 'B',
      status: 'SELECTED',
    });
    expect(prismaMock.toeicRunAnswer.count).not.toHaveBeenCalled();
  });

  it('updates an existing mock selection', async () => {
    mockOpenRun('MOCK_TEST');
    prismaMock.toeicRunAnswer.findUnique.mockResolvedValue({ id: 'answer-id' });

    await grader.submitAnswer('user-id', 'run-id', {
      toeicQuestionId: 1001,
      selectedKey: 'C',
    });

    const updateCalls = prismaMock.toeicRunAnswer.update.mock
      .calls as unknown as Array<
      [
        {
          where: { id: string };
          data: { selectedKey: string; status: string; gradedAt: null };
        },
      ]
    >;
    expect(updateCalls[0]?.[0]).toMatchObject({
      where: { id: 'answer-id' },
      data: { selectedKey: 'C', status: 'SELECTED', gradedAt: null },
    });
  });

  it('rejects a question outside the run selected parts', async () => {
    mockOpenRun();
    prismaMock.toeicQuestion.findUnique.mockResolvedValue({
      ...question,
      group: { ...question.group, testPart: { testId: 1, partNumber: 2 } },
    });

    await expect(
      grader.submitAnswer('user-id', 'run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).rejects.toThrow('Question does not belong to this session.');
  });

  it('locks graded practice answers, while allowing an idempotent retry', async () => {
    mockOpenRun();
    prismaMock.toeicRunAnswer.findUnique.mockResolvedValue({
      id: 'answer-id',
      selectedKey: 'A',
      status: 'RIGHT',
    });

    await expect(
      grader.submitAnswer('user-id', 'run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).resolves.toMatchObject({ graded: true, isCorrect: true });

    await expect(
      grader.submitAnswer('user-id', 'run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
      }),
    ).rejects.toThrow('Graded answers cannot be changed.');
  });

  it('grades a practice group once every catalog question is selected', async () => {
    mockOpenRun();
    prismaMock.toeicRunAnswer.findUnique.mockResolvedValue(null);
    prismaMock.toeicQuestion.findMany.mockResolvedValue([
      { id: 1001, answerKey: 'A' },
      { id: 1002, answerKey: 'B' },
    ]);
    prismaMock.toeicRunAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-1',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: 'SELECTED',
      },
      {
        id: 'answer-2',
        toeicQuestionId: 1002,
        selectedKey: 'C',
        status: 'SELECTED',
      },
    ]);
    prismaMock.toeicRunAnswer.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    await expect(
      grader.submitAnswer('user-id', 'run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).resolves.toMatchObject({ graded: true, isCorrect: true });

    const updateInputs = prismaMock.toeicRunAnswer.update.mock
      .calls as unknown as Array<
      [{ where: { id: string }; data: { status: string } }]
    >;
    expect(
      updateInputs.find(([input]) => input.where.id === 'answer-1')?.[0].data
        .status,
    ).toBe('RIGHT');
    expect(
      updateInputs.find(([input]) => input.where.id === 'answer-2')?.[0].data
        .status,
    ).toBe('WRONG');
  });

  it('retries only wrong answers in review mode', async () => {
    mockOpenRun();
    prismaMock.toeicRunAnswer.findUnique.mockResolvedValue({
      id: 'answer-id',
      selectedKey: 'B',
      status: 'WRONG',
    });
    prismaMock.toeicQuestion.findMany.mockResolvedValue([
      { id: 1001, answerKey: 'A' },
    ]);
    prismaMock.toeicRunAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-id',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: 'SELECTED',
      },
    ]);
    prismaMock.toeicRunAnswer.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    await expect(
      grader.submitAnswer('user-id', 'run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
        mode: 'review_wrong',
      }),
    ).resolves.toMatchObject({ graded: true, isCorrect: true });
  });

  it('finishes a mock from catalog questions without storing blank answers', async () => {
    const completedAt = new Date('2026-06-21T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(completedAt);
    prismaMock.$queryRaw.mockResolvedValue([
      { id: 'run-id', completedAt: null },
    ]);
    prismaMock.toeicRun.findUnique.mockResolvedValue({
      toeicTestId: 1,
      selectedParts: [1],
    });
    prismaMock.toeicQuestion.findMany.mockResolvedValue([
      { id: 1001, answerKey: 'A' },
      { id: 1002, answerKey: 'C' },
    ]);
    prismaMock.toeicRunAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-id',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: 'SELECTED',
      },
    ]);

    await grader.completeMockRun('run-id');

    expect(prismaMock.toeicRunAnswer.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.toeicRunAnswer.create).not.toHaveBeenCalled();
    expect(prismaMock.toeicRun.update).toHaveBeenCalledWith({
      where: { id: 'run-id' },
      data: { totalRight: 1, totalWrong: 1, completedAt },
    });
    jest.useRealTimers();
  });
});

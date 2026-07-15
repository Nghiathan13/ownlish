/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { ToeicPartPracticeGrader } from './grader';
import { ToeicPartPracticeRepository } from './repository';

describe('ToeicPartPracticeGrader', () => {
  let grader: ToeicPartPracticeGrader;

  const repositoryMock = {
    findOwnedRun: jest.fn(),
    findQuestionWithTestPart: jest.fn(),
    lockRunForUpdate: jest.fn(),
    transaction: jest.fn(),
  };

  const txMock = {
    toeicQuestion: {
      findMany: jest.fn(),
    },
    toeicPartPracticeAnswer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    toeicPartPracticeRun: {
      update: jest.fn(),
    },
  };

  const question = {
    id: 1001,
    answerKey: 'A',
    group: { id: 101, testPart: { testId: 1, partNumber: 1 } },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    repositoryMock.lockRunForUpdate.mockResolvedValue({ id: 'part-run-id' });
    repositoryMock.transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<unknown>) =>
        callback(txMock),
    );
    txMock.toeicPartPracticeRun.update.mockResolvedValue({});
    txMock.toeicPartPracticeAnswer.update.mockResolvedValue({});
    txMock.toeicPartPracticeAnswer.create.mockResolvedValue({});
    txMock.toeicPartPracticeAnswer.findUnique.mockResolvedValue(null);
    txMock.toeicPartPracticeAnswer.count.mockResolvedValue(0);
    txMock.toeicQuestion.findMany.mockResolvedValue([
      { id: 1001, answerKey: 'A' },
    ]);
    txMock.toeicPartPracticeAnswer.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicPartPracticeGrader,
        { provide: ToeicPartPracticeRepository, useValue: repositoryMock },
      ],
    }).compile();

    grader = module.get(ToeicPartPracticeGrader);
  });

  it('grades a single-question group when the answer is selected', async () => {
    repositoryMock.findOwnedRun.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
    txMock.toeicPartPracticeAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-1',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.SELECTED,
      },
    ]);

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).resolves.toMatchObject({ graded: true, isCorrect: true });

    expect(txMock.toeicPartPracticeAnswer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runId: 'part-run-id',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.SELECTED,
      }),
    });
    expect(txMock.toeicPartPracticeAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: expect.objectContaining({
        status: ToeicRunQuestionStatus.RIGHT,
      }),
    });
  });

  it('does not grade when not every question in the group is selected', async () => {
    repositoryMock.findOwnedRun.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
    txMock.toeicQuestion.findMany.mockResolvedValue([
      { id: 1001, answerKey: 'A' },
      { id: 1002, answerKey: 'B' },
    ]);
    txMock.toeicPartPracticeAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-1',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.SELECTED,
      },
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
      repositoryMock.findOwnedRun.mockResolvedValue({
        id: 'part-run-id',
        partNumber: 1,
      });
      repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
      txMock.toeicPartPracticeAnswer.findUnique.mockResolvedValue({
        id: 'answer-1',
        toeicQuestionId: 1001,
        selectedKey,
        status:
          status === 'RIGHT'
            ? ToeicRunQuestionStatus.RIGHT
            : ToeicRunQuestionStatus.WRONG,
      });

      await expect(
        grader.submitAnswer('user-id', 'part-run-id', {
          toeicQuestionId: 1001,
          selectedKey,
        }),
      ).resolves.toMatchObject({ graded: true, isCorrect });

      expect(txMock.toeicPartPracticeAnswer.update).not.toHaveBeenCalled();
      expect(txMock.toeicPartPracticeAnswer.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['RIGHT', 'A', 'B'],
    ['WRONG', 'B', 'A'],
  ] as const)(
    'rejects changing an already %s answer',
    async (status, previousSelectedKey, selectedKey) => {
      repositoryMock.findOwnedRun.mockResolvedValue({
        id: 'part-run-id',
        partNumber: 1,
      });
      repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
      txMock.toeicPartPracticeAnswer.findUnique.mockResolvedValue({
        id: 'answer-1',
        toeicQuestionId: 1001,
        selectedKey: previousSelectedKey,
        status:
          status === 'RIGHT'
            ? ToeicRunQuestionStatus.RIGHT
            : ToeicRunQuestionStatus.WRONG,
      });

      await expect(
        grader.submitAnswer('user-id', 'part-run-id', {
          toeicQuestionId: 1001,
          selectedKey,
        }),
      ).rejects.toThrow('Graded answers cannot be changed.');

      expect(txMock.toeicPartPracticeAnswer.update).not.toHaveBeenCalled();
      expect(txMock.toeicPartPracticeAnswer.create).not.toHaveBeenCalled();
    },
  );

  it('allows review wrong to replace a wrong answer', async () => {
    repositoryMock.findOwnedRun.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
    txMock.toeicPartPracticeAnswer.findUnique.mockResolvedValue({
      id: 'answer-1',
      toeicQuestionId: 1001,
      selectedKey: 'B',
      status: ToeicRunQuestionStatus.WRONG,
    });
    txMock.toeicQuestion.findMany.mockResolvedValue([
      { id: 1001, answerKey: 'A' },
      { id: 1002, answerKey: 'B' },
    ]);
    txMock.toeicPartPracticeAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-1',
        toeicQuestionId: 1001,
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.SELECTED,
      },
    ]);

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
        mode: 'review_wrong',
      }),
    ).resolves.toEqual({ graded: false });

    expect(txMock.toeicPartPracticeAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: expect.objectContaining({
        selectedKey: 'A',
        status: ToeicRunQuestionStatus.SELECTED,
      }),
    });
  });

  it('keeps right answers locked in review wrong mode', async () => {
    repositoryMock.findOwnedRun.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
    txMock.toeicPartPracticeAnswer.findUnique.mockResolvedValue({
      id: 'answer-1',
      toeicQuestionId: 1001,
      selectedKey: 'A',
      status: ToeicRunQuestionStatus.RIGHT,
    });

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'B',
        mode: 'review_wrong',
      }),
    ).rejects.toThrow('Graded answers cannot be changed.');

    expect(txMock.toeicPartPracticeAnswer.update).not.toHaveBeenCalled();
    expect(txMock.toeicPartPracticeAnswer.create).not.toHaveBeenCalled();
    expect(txMock.toeicPartPracticeRun.update).not.toHaveBeenCalled();
  });

  it('reads the answer only after the run is locked', async () => {
    repositoryMock.findOwnedRun.mockResolvedValue({
      id: 'part-run-id',
      partNumber: 1,
    });
    repositoryMock.findQuestionWithTestPart.mockResolvedValue(question);
    txMock.toeicPartPracticeAnswer.findUnique.mockResolvedValue({
      id: 'answer-1',
      toeicQuestionId: 1001,
      selectedKey: 'A',
      status: ToeicRunQuestionStatus.RIGHT,
    });

    await expect(
      grader.submitAnswer('user-id', 'part-run-id', {
        toeicQuestionId: 1001,
        selectedKey: 'A',
      }),
    ).resolves.toMatchObject({ graded: true, isCorrect: true });

    expect(
      repositoryMock.lockRunForUpdate.mock.invocationCallOrder[0],
    ).toBeLessThan(
      txMock.toeicPartPracticeAnswer.findUnique.mock.invocationCallOrder[0],
    );
  });
});

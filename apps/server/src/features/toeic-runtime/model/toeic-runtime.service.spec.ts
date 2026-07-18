import {
  ToeicLearningScope,
  ToeicRunMode,
  ToeicRunQuestionStatus,
} from '@prisma/client';
import { ToeicRuntimeService } from './toeic-runtime.service';

function createRun(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    scope: ToeicLearningScope.TEST,
    testKey: 'ets26-t01',
    partNumber: null,
    mode: ToeicRunMode.MOCK_TEST,
    selectedParts: [1],
    totalRight: 0,
    totalWrong: 0,
    finishRequestedAt: null,
    completedAt: null,
    answers: [],
    ...overrides,
  };
}

describe('ToeicRuntimeService', () => {
  it('creates a mock run using catalog keys instead of legacy content IDs', async () => {
    const create = jest.fn().mockResolvedValue(createRun());
    const prisma = {
      toeicLearningRun: { create },
    };
    const gradingIndex = {
      hasTestParts: jest.fn().mockReturnValue(true),
    };
    const service = new ToeicRuntimeService(
      prisma as never,
      gradingIndex as never,
    );

    const result = await service.createTestRun('user-id', {
      testKey: 'ets26-t01',
      partNumbers: [1],
      mode: 'mock_test',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        scope: ToeicLearningScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts: [1],
      },
      include: { answers: true },
    });
    expect(result).toMatchObject({
      scope: 'test',
      testKey: 'ets26-t01',
      mode: 'mock_test',
      finish: { status: 'open' },
    });
  });

  it('returns test practice progress keyed by catalog test key', async () => {
    const findMany = jest.fn().mockResolvedValue([
      createRun({
        mode: ToeicRunMode.PRACTICE,
        answers: [
          {
            questionKey: 'ets26-t01-p1-q001',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q007',
            status: ToeicRunQuestionStatus.WRONG,
          },
        ],
        totalRight: 1,
        totalWrong: 1,
      }),
    ]);
    const prisma = { toeicLearningRun: { findMany } };
    const gradingIndex = {
      getQuestion: jest.fn((questionKey: string) => {
        if (questionKey === 'ets26-t01-p1-q001') {
          return { testKey: 'ets26-t01', partNumber: 1 };
        }

        return { testKey: 'ets26-t01', partNumber: 2 };
      }),
    };
    const service = new ToeicRuntimeService(
      prisma as never,
      gradingIndex as never,
    );

    await expect(service.listTestPracticeRuns('user-id')).resolves.toEqual({
      items: [
        {
          testKey: 'ets26-t01',
          answeredCount: 2,
          correctCount: 1,
          wrongCount: 1,
          parts: [
            { partNumber: 1, correctCount: 1, wrongCount: 0 },
            { partNumber: 2, correctCount: 0, wrongCount: 1 },
          ],
        },
      ],
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        scope: ToeicLearningScope.TEST,
        mode: ToeicRunMode.PRACTICE,
      },
      include: { answers: { select: { questionKey: true, status: true } } },
    });
  });

  it('clears only the practice run for one catalog test key', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = { toeicLearningRun: { deleteMany } };
    const service = new ToeicRuntimeService(prisma as never, {} as never);

    await expect(
      service.clearTestPracticeRun('user-id', 'ybm26-t01'),
    ).resolves.toEqual({ resetRunCount: 1 });
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        scope: ToeicLearningScope.TEST,
        testKey: 'ybm26-t01',
        mode: ToeicRunMode.PRACTICE,
      },
    });
  });
});

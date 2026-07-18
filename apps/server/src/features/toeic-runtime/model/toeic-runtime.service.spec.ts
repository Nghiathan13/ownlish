import { ToeicLearningScope, ToeicRunMode } from '@prisma/client';
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
});

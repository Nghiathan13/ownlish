import {
  ToeicRunScope,
  ToeicRunMode,
  ToeicRunQuestionStatus,
} from '@prisma/client';
import { ToeicRuntimeService } from './toeic-runtime.service';

function createRun(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    scope: ToeicRunScope.TEST,
    testKey: 'ets26-t01',
    partNumber: null,
    mode: ToeicRunMode.MOCK_TEST,
    selectedParts: [1],
    totalRight: 0,
    totalWrong: 0,
    timeLimitSeconds: 300,
    remainingSeconds: 300,
    finishRequestedAt: null,
    completedAt: null,
    answers: [],
    ...overrides,
  };
}

describe('ToeicRuntimeService', () => {
  it('creates a mock run using catalog keys instead of legacy content IDs', async () => {
    const create = jest.fn().mockResolvedValue(createRun());
    const findFirst = jest.fn().mockResolvedValue(null);
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: { create, findFirst },
    };
    const prisma = {
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
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
        scope: ToeicRunScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts: [1],
        timeLimitSeconds: 300,
        remainingSeconds: 300,
      },
      include: { answers: true },
    });
    expect(result).toMatchObject({
      scope: 'test',
      testKey: 'ets26-t01',
      mode: 'mock_test',
      timer: { timeLimitSeconds: 300, remainingSeconds: 300 },
      finish: { status: 'open' },
    });
  });

  it('snapshots the combined duration of every selected mock part', async () => {
    const create = jest.fn().mockResolvedValue(
      createRun({
        selectedParts: [1, 3, 7],
        timeLimitSeconds: 4_500,
        remainingSeconds: 4_500,
      }),
    );
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: {
        create,
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new ToeicRuntimeService(
      {
        $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
          callback(transaction),
      } as never,
      { hasTestParts: jest.fn().mockReturnValue(true) } as never,
    );

    await service.createTestRun('user-id', {
      testKey: 'ets26-t01',
      partNumbers: [1, 3, 7],
      mode: 'mock_test',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        scope: ToeicRunScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts: [1, 3, 7],
        timeLimitSeconds: 4_500,
        remainingSeconds: 4_500,
      },
      include: { answers: true },
    });
  });

  it('uses a custom mock duration in minutes', async () => {
    const create = jest
      .fn()
      .mockResolvedValue(
        createRun({ timeLimitSeconds: 10_800, remainingSeconds: 10_800 }),
      );
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: {
        create,
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new ToeicRuntimeService(
      {
        $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
          callback(transaction),
      } as never,
      { hasTestParts: jest.fn().mockReturnValue(true) } as never,
    );

    await service.createTestRun('user-id', {
      testKey: 'ets26-t01',
      partNumbers: [1],
      mode: 'mock_test',
      timeLimitMinutes: 180,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        scope: ToeicRunScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts: [1],
        timeLimitSeconds: 10_800,
        remainingSeconds: 10_800,
      },
      include: { answers: true },
    });
  });

  it('only decreases a mock timer when a stale client syncs', async () => {
    const update = jest.fn();
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: '11111111-1111-4111-8111-111111111111',
          finishRequestedAt: null,
          completedAt: null,
          remainingSeconds: 160,
        },
      ]),
      toeicRun: { update },
    };
    const prisma = {
      toeicRun: {
        findFirst: jest
          .fn()
          .mockResolvedValue(createRun({ remainingSeconds: 160 })),
      },
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
    };
    const service = new ToeicRuntimeService(prisma as never, {} as never);

    await expect(
      service.updateMockTimer(
        'user-id',
        '11111111-1111-4111-8111-111111111111',
        { remainingSeconds: 180 },
      ),
    ).resolves.toEqual({ remainingSeconds: 160 });
    expect(update).not.toHaveBeenCalled();

    await expect(
      service.updateMockTimer(
        'user-id',
        '11111111-1111-4111-8111-111111111111',
        { remainingSeconds: 140 },
      ),
    ).resolves.toEqual({ remainingSeconds: 140 });
    expect(update).toHaveBeenCalledWith({
      where: { id: '11111111-1111-4111-8111-111111111111' },
      data: { remainingSeconds: 140 },
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
    const prisma = { toeicRun: { findMany } };
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
        scope: ToeicRunScope.TEST,
        mode: ToeicRunMode.PRACTICE,
      },
      include: { answers: { select: { questionKey: true, status: true } } },
    });
  });

  it('clears only the practice run for one catalog test key', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = { toeicRun: { deleteMany } };
    const service = new ToeicRuntimeService(prisma as never, {} as never);

    await expect(
      service.clearTestPracticeRun('user-id', 'ybm26-t01'),
    ).resolves.toEqual({ resetRunCount: 1 });
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        scope: ToeicRunScope.TEST,
        testKey: 'ybm26-t01',
        mode: ToeicRunMode.PRACTICE,
      },
    });
  });

  it('lists completed and unfinished mock runs for one test only', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        selectedParts: [1, 2],
        totalRight: 12,
        totalWrong: 8,
        finishRequestedAt: new Date('2026-07-25T00:00:00.000Z'),
        completedAt: new Date('2026-07-25T00:01:00.000Z'),
        answers: [
          {
            questionKey: 'ets26-t01-p1-q001',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q001',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q002',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q003',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q004',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q005',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q006',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q007',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q008',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q009',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q010',
            status: ToeicRunQuestionStatus.RIGHT,
          },
          {
            questionKey: 'ets26-t01-p2-q011',
            status: ToeicRunQuestionStatus.RIGHT,
          },
        ],
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        selectedParts: [3],
        totalRight: 0,
        totalWrong: 0,
        finishRequestedAt: null,
        completedAt: null,
        answers: [],
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        selectedParts: [4],
        totalRight: 0,
        totalWrong: 0,
        finishRequestedAt: new Date('2026-07-25T00:02:00.000Z'),
        completedAt: null,
        answers: [],
      },
    ]);
    const getTestQuestions = jest.fn().mockResolvedValue([
      {
        questionKey: 'ets26-t01-p1-q001',
        partNumber: 1,
      },
      ...Array.from({ length: 11 }, (_, index) => ({
        questionKey: `ets26-t01-p2-q${String(index + 1).padStart(3, '0')}`,
        partNumber: 2,
      })),
    ]);
    const service = new ToeicRuntimeService(
      { toeicRun: { findMany } } as never,
      { getTestQuestions } as never,
    );

    await expect(service.listMockRuns('user-id', 'ets26-t01')).resolves.toEqual(
      {
        items: [
          {
            sessionId: '11111111-1111-4111-8111-111111111111',
            selectedParts: [1, 2],
            correctCount: 12,
            wrongCount: 8,
            score: { listening: 70, reading: 5, total: 75 },
            status: 'completed',
          },
          {
            sessionId: '22222222-2222-4222-8222-222222222222',
            selectedParts: [3],
            status: 'open',
          },
          {
            sessionId: '33333333-3333-4333-8333-333333333333',
            selectedParts: [4],
            status: 'pending',
          },
        ],
      },
    );
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        scope: ToeicRunScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        selectedParts: true,
        totalRight: true,
        totalWrong: true,
        finishRequestedAt: true,
        completedAt: true,
        answers: { select: { questionKey: true, status: true } },
      },
    });
    expect(getTestQuestions).toHaveBeenCalledWith('ets26-t01', [1, 2]);
  });

  it('finds an unfinished mock run only for the exact part selection', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      selectedParts: [1, 2],
      finishRequestedAt: null,
    });
    const service = new ToeicRuntimeService(
      { toeicRun: { findFirst } } as never,
      { hasTestParts: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      service.prepareMockRun('user-id', {
        testKey: 'ets26-t01',
        partNumbers: [2, 1],
      }),
    ).resolves.toEqual({
      status: 'open',
      run: {
        sessionId: '11111111-1111-4111-8111-111111111111',
        selectedParts: [1, 2],
      },
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        scope: ToeicRunScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts: { equals: [1, 2] },
        completedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        selectedParts: true,
        finishRequestedAt: true,
      },
    });
  });

  it('restarts every matching open mock run before creating a new one', async () => {
    const create = jest.fn().mockResolvedValue(createRun());
    const deleteMany = jest.fn();
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: {
        create,
        deleteMany,
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'old-run-id', finishRequestedAt: null }]),
      },
    };
    const service = new ToeicRuntimeService(
      {
        $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
          callback(transaction),
      } as never,
      { hasTestParts: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      service.restartMockRun('user-id', {
        testKey: 'ets26-t01',
        partNumbers: [1],
      }),
    ).resolves.toMatchObject({
      sessionId: '11111111-1111-4111-8111-111111111111',
      timer: { timeLimitSeconds: 300, remainingSeconds: 300 },
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-run-id'] } },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        scope: ToeicRunScope.TEST,
        testKey: 'ets26-t01',
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts: [1],
        timeLimitSeconds: 300,
        remainingSeconds: 300,
      },
      include: { answers: true },
    });
  });
});

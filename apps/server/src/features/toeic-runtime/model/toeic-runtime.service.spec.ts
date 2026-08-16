import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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

  it('rejects unavailable test and part selections before persisting a run', async () => {
    const hasTestParts = jest.fn().mockResolvedValue(false);
    const hasPart = jest.fn().mockResolvedValue(false);
    const service = new ToeicRuntimeService(
      {} as never,
      { hasTestParts, hasPart } as never,
    );

    await expect(
      service.createTestRun('user-id', {
        testKey: 'missing-test',
        partNumbers: [1],
        mode: 'practice',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createPartPracticeRun('user-id', { partNumber: 7 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns an available mock selection when no owned open run exists', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = new ToeicRuntimeService(
      { toeicRun: { findFirst } } as never,
      { hasTestParts: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      service.prepareMockRun('user-id', {
        testKey: 'ets26-t01',
        partNumbers: [1],
      }),
    ).resolves.toEqual({ status: 'available' });
  });

  it('reuses and extends an owned practice test run without duplicating it', async () => {
    const existing = createRun({
      id: 'practice-run-id',
      mode: ToeicRunMode.PRACTICE,
      selectedParts: [1],
    });
    const update = jest.fn().mockResolvedValue(
      createRun({
        id: 'practice-run-id',
        mode: ToeicRunMode.PRACTICE,
        selectedParts: [1, 2],
      }),
    );
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: { findFirst: jest.fn().mockResolvedValue(existing), update },
    };
    const service = new ToeicRuntimeService(
      {
        $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
          callback(transaction),
      } as never,
      { hasTestParts: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      service.createTestRun('user-id', {
        testKey: 'ets26-t01',
        partNumbers: [2, 1],
        mode: 'practice',
      }),
    ).resolves.toMatchObject({ selectedParts: [1, 2] });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'practice-run-id' },
      data: { selectedParts: [1, 2] },
      include: { answers: true },
    });
  });

  it('creates or reuses an owned part-practice run', async () => {
    const created = createRun({
      scope: ToeicRunScope.PART_PRACTICE,
      partNumber: 3,
      testKey: null,
      mode: ToeicRunMode.PRACTICE,
      selectedParts: [3],
    });
    const create = jest.fn().mockResolvedValue(created);
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: { findFirst: jest.fn().mockResolvedValue(null), create },
    };
    const service = new ToeicRuntimeService(
      {
        $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
          callback(transaction),
      } as never,
      { hasPart: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      service.createPartPracticeRun('user-id', { partNumber: 3 }),
    ).resolves.toMatchObject({
      scope: 'part_practice',
      partNumber: 3,
      selectedParts: [3],
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        scope: ToeicRunScope.PART_PRACTICE,
        partNumber: 3,
        selectedParts: [3],
      },
      include: { answers: true },
    });
  });

  it('lists part-practice progress and validates the reset part number', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        partNumber: 2,
        totalRight: 3,
        totalWrong: 1,
        answers: [{ status: ToeicRunQuestionStatus.RIGHT }],
      },
    ]);
    const service = new ToeicRuntimeService(
      { toeicRun: { findMany } } as never,
      {} as never,
    );

    await expect(service.listPartPracticeRuns('user-id')).resolves.toEqual({
      items: [
        {
          partNumber: 2,
          answeredCount: 1,
          correctCount: 3,
          wrongCount: 1,
        },
      ],
    });
    await expect(service.clearPartPracticeRun('user-id', 8)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects missing, foreign-question, closed, and invalid timer operations', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createRun())
      .mockResolvedValueOnce(createRun({ completedAt: new Date() }))
      .mockResolvedValueOnce(createRun({ mode: ToeicRunMode.PRACTICE }));
    const service = new ToeicRuntimeService(
      { toeicRun: { findFirst } } as never,
      { getQuestion: jest.fn().mockResolvedValue(null) } as never,
    );

    await expect(service.getRun('user-id', 'missing')).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.submitAnswer('user-id', 'run-id', {
        questionKey: 'foreign-question',
        selectedKey: 'A',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.submitAnswer('user-id', 'run-id', {
        questionKey: 'foreign-question',
        selectedKey: 'A',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateMockTimer('user-id', 'run-id', { remainingSeconds: 10 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not restart a mock selection that is already pending grading', async () => {
    const transaction = {
      $executeRaw: jest.fn(),
      toeicRun: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'pending-run', finishRequestedAt: new Date() },
          ]),
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
    ).rejects.toThrow(ConflictException);
  });

  it('awards Test XP only when a practice answer transitions to RIGHT', async () => {
    const experienceAwarder = { award: jest.fn() };
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'run-id',
          finishRequestedAt: null,
          completedAt: null,
          remainingSeconds: null,
        },
      ]),
      toeicRun: { update: jest.fn() },
      toeicRunAnswer: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'answer-id',
            questionKey: 'q1',
            selectedKey: 'A',
            status: ToeicRunQuestionStatus.SELECTED,
          },
        ]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        upsert: jest.fn(),
      },
    };
    const gradingIndex = {
      getGroupQuestions: jest.fn().mockResolvedValue([
        {
          testKey: 'ets26-t01',
          partNumber: 1,
          groupKey: 'q1',
          questionKey: 'q1',
          answerKey: 'A',
        },
      ]),
    };
    const service = new ToeicRuntimeService(
      {
        $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
          callback(transaction),
      } as never,
      gradingIndex as never,
      experienceAwarder,
    );

    await expect(
      (
        service as unknown as {
          savePracticeAnswer(
            run: object,
            question: object,
            questionKey: string,
            selectedKey: string,
            reviewWrong: boolean,
          ): Promise<{ graded: boolean }>;
        }
      ).savePracticeAnswer(
        { id: 'run-id', userId: 'user-id' },
        { testKey: 'ets26-t01', partNumber: 1, groupKey: 'q1' },
        'q1',
        'A',
        false,
      ),
    ).resolves.toEqual({ graded: true });

    expect(experienceAwarder.award).toHaveBeenCalledWith(transaction, {
      type: 'correct-answer',
      userId: 'user-id',
      questionKey: 'q1',
      bucket: 'test',
    });
  });

  it('awards correct Mock answers and a part bonus only after finalization with every part question submitted', async () => {
    const experienceAwarder = { award: jest.fn() };
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'run-id' }]),
      toeicRun: { update: jest.fn(), findUnique: jest.fn() },
      toeicRunAnswer: { update: jest.fn() },
    };
    const finalizedRun = {
      id: 'run-id',
      userId: 'user-id',
      testKey: 'ets26-t01',
      selectedParts: [1],
      finishRequestedAt: new Date(),
      completedAt: null,
      answers: [
        { id: 'answer-1', questionKey: 'q1', selectedKey: 'A' },
        { id: 'answer-2', questionKey: 'q2', selectedKey: 'B' },
      ],
    };
    const prisma = {
      toeicRun: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            testKey: 'ets26-t01',
            selectedParts: [1],
            finishRequestedAt: new Date(),
            completedAt: null,
          })
          .mockResolvedValueOnce(finalizedRun),
      },
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
    };
    transaction.toeicRun.findUnique.mockResolvedValue(finalizedRun);
    const gradingIndex = {
      getTestQuestions: jest.fn().mockResolvedValue([
        { questionKey: 'q1', partNumber: 1, answerKey: 'A' },
        { questionKey: 'q2', partNumber: 1, answerKey: 'A' },
      ]),
    };
    const service = new ToeicRuntimeService(
      prisma as never,
      gradingIndex as never,
      experienceAwarder,
    );

    await expect(
      (
        service as unknown as {
          completeMockRun(runId: string): Promise<boolean>;
        }
      ).completeMockRun('run-id'),
    ).resolves.toBe(true);

    expect(experienceAwarder.award).toHaveBeenCalledWith(transaction, {
      type: 'correct-answer',
      userId: 'user-id',
      questionKey: 'q1',
      bucket: 'mock',
    });
    expect(experienceAwarder.award).toHaveBeenCalledWith(transaction, {
      type: 'mock-part',
      userId: 'user-id',
      testKey: 'ets26-t01',
      partNumber: 1,
    });
  });
});

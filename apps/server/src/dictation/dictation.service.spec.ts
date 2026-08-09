import { DictationService } from './dictation.service';

const now = new Date('2026-07-27T00:00:00.000Z');

function createProgress(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    userId: 'user-id',
    videoId: 'video-id',
    answeredSegmentIds: ['s1'],
    correctCount: 1,
    completedAt: null,
    updatedAt: now,
    ...overrides,
  };
}

describe('DictationService', () => {
  function createService(existing: ReturnType<typeof createProgress> | null) {
    const transaction = {
      $executeRaw: jest.fn(),
      dictationProgress: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn(),
      },
    };
    const prisma = {
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
      dictationProgress: {
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    return {
      service: new DictationService(prisma as never),
      transaction,
      prisma,
    };
  }

  it('creates progress for the first answered segment', async () => {
    const { service, transaction } = createService(null);
    transaction.dictationProgress.create.mockResolvedValue(
      createProgress({ answeredSegmentIds: ['s1'] }),
    );

    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's1',
        isCompleted: false,
      }),
    ).resolves.toMatchObject({
      answeredSegmentIds: ['s1'],
      correctCount: 1,
    });
    expect(transaction.dictationProgress.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        videoId: 'video-id',
        answeredSegmentIds: ['s1'],
        correctCount: 1,
        completedAt: null,
      },
    });
  });

  it('records an answer for a new segment', async () => {
    const existing = createProgress({
      answeredSegmentIds: ['s1'],
    });
    const { service, transaction } = createService(existing);
    transaction.dictationProgress.update.mockResolvedValue(
      createProgress({
        answeredSegmentIds: ['s1', 's2'],
        correctCount: 2,
      }),
    );

    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's2',
        isCompleted: false,
      }),
    ).resolves.toMatchObject({
      answeredSegmentIds: ['s1', 's2'],
      correctCount: 2,
    });
    expect(transaction.dictationProgress.update).toHaveBeenCalledTimes(1);
  });

  it('marks progress complete when the client has answered every segment', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    const existing = createProgress({ answeredSegmentIds: ['s1'] });
    const { service, transaction } = createService(existing);
    transaction.dictationProgress.update.mockResolvedValue(
      createProgress({
        answeredSegmentIds: ['s1', 's2'],
        correctCount: 2,
        completedAt: now,
      }),
    );

    try {
      await service.submitAnswer('user-id', 'video-id', {
        segmentId: 's2',
        isCompleted: true,
      });

      expect(transaction.dictationProgress.update).toHaveBeenCalledWith({
        where: { userId_videoId: { userId: 'user-id', videoId: 'video-id' } },
        data: {
          answeredSegmentIds: ['s1', 's2'],
          correctCount: 2,
          completedAt: now,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not double-count an already answered segment', async () => {
    const existing = createProgress({
      answeredSegmentIds: ['s1'],
      correctCount: 1,
    });
    const { service, transaction } = createService(existing);

    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's1',
        isCompleted: false,
      }),
    ).resolves.toMatchObject({
      answeredSegmentIds: ['s1'],
      correctCount: 1,
    });
    expect(transaction.dictationProgress.update).not.toHaveBeenCalled();
  });

  it('removes a user video progress record on restart', async () => {
    const { service, prisma } = createService(null);

    await service.resetProgress('user-id', 'video-id');

    expect(prisma.dictationProgress.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', videoId: 'video-id' },
    });
  });
});

import { DictationService } from './dictation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
      dictationCatalogSegment: {
        findUnique: jest.fn().mockResolvedValue({ transcript: 'Hello world' }),
      },
      dictationCatalogVideo: {
        findUnique: jest.fn().mockResolvedValue({ segmentCount: 2 }),
      },
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
    const experienceAwarder = { award: jest.fn().mockResolvedValue(4) };

    return {
      service: new DictationService(prisma as never, experienceAwarder),
      experienceAwarder,
      transaction,
      prisma,
    };
  }

  it('creates progress for the first answered segment', async () => {
    const { experienceAwarder, service, transaction } = createService(null);
    transaction.dictationProgress.create.mockResolvedValue(
      createProgress({ answeredSegmentIds: ['s1'] }),
    );

    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's1',
        answer: 'Hello world',
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
    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1);
    expect(experienceAwarder.award).toHaveBeenCalledWith(transaction, {
      type: 'dictation-segment',
      userId: 'user-id',
      videoId: 'video-id',
      segmentId: 's1',
    });
  });

  it('returns formatted progress when it exists', async () => {
    const { service, prisma } = createService(null);
    const completedAt = new Date('2026-07-27T01:00:00.000Z');
    prisma.dictationProgress.findUnique.mockResolvedValue(
      createProgress({ completedAt }),
    );

    await expect(service.getProgress('user-id', 'video-id')).resolves.toEqual({
      videoId: 'video-id',
      answeredSegmentIds: ['s1'],
      correctCount: 1,
      completedAt: completedAt.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(prisma.dictationProgress.findUnique).toHaveBeenCalledWith({
      where: { userId_videoId: { userId: 'user-id', videoId: 'video-id' } },
    });
  });

  it('returns null when the user has not started a video', async () => {
    const { service, prisma } = createService(null);
    prisma.dictationProgress.findUnique.mockResolvedValue(null);

    await expect(
      service.getProgress('user-id', 'video-id'),
    ).resolves.toBeNull();
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
        answer: 'Hello world',
      }),
    ).resolves.toMatchObject({
      answeredSegmentIds: ['s1', 's2'],
      correctCount: 2,
    });
    expect(transaction.dictationProgress.update).toHaveBeenCalledTimes(1);
  });

  it('derives completion from the synced segment count', async () => {
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
        answer: 'Hello world',
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

  it('awards a video only when its final server-verified segment is accepted', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    const { experienceAwarder, service, transaction } = createService(null);
    transaction.dictationCatalogVideo.findUnique.mockResolvedValue({
      segmentCount: 1,
    });
    transaction.dictationProgress.create.mockResolvedValue(
      createProgress({ completedAt: now }),
    );

    try {
      await service.submitAnswer('user-id', 'video-id', {
        segmentId: 's1',
        answer: 'Hello world',
      });

      expect(experienceAwarder.award).toHaveBeenCalledWith(transaction, {
        type: 'dictation-video',
        userId: 'user-id',
        videoId: 'video-id',
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
        answer: 'Hello world',
      }),
    ).resolves.toMatchObject({
      answeredSegmentIds: ['s1'],
      correctCount: 1,
    });
    expect(transaction.dictationProgress.update).not.toHaveBeenCalled();
  });

  it('rejects unknown segments and answers that do not match the synced transcript', async () => {
    const { service, transaction } = createService(null);
    transaction.dictationCatalogSegment.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's999',
        answer: 'Hello world',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    transaction.dictationCatalogSegment.findUnique.mockResolvedValueOnce({
      transcript: 'Hello world',
    });
    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's1',
        answer: 'Wrong answer',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    transaction.dictationCatalogSegment.findUnique.mockResolvedValueOnce({
      transcript: 'Hello world',
    });
    transaction.dictationCatalogVideo.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.submitAnswer('user-id', 'video-id', {
        segmentId: 's1',
        answer: 'Hello world',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a user video progress record on restart', async () => {
    const { service, prisma } = createService(null);

    await service.resetProgress('user-id', 'video-id');

    expect(prisma.dictationProgress.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', videoId: 'video-id' },
    });
  });
});

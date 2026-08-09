import { BadRequestException } from '@nestjs/common';
import { LearningActivityType } from '@prisma/client';
import {
  LearningActivityService,
  splitCheckpointByVietnamDay,
} from './learning-activity.service';

function createService() {
  const prisma = {
    $transaction: jest.fn().mockResolvedValue([]),
    userLearningDaily: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  return { prisma, service: new LearningActivityService(prisma as never) };
}

describe('LearningActivityService', () => {
  it('keeps a checkpoint within its Vietnam learning day', () => {
    expect(
      splitCheckpointByVietnamDay(new Date('2026-07-30T10:00:00.000Z'), 60),
    ).toEqual([
      {
        learnedOn: new Date('2026-07-30T00:00:00.000Z'),
        seconds: 60,
      },
    ]);
  });

  it('splits a checkpoint that crosses midnight in Vietnam', () => {
    expect(
      splitCheckpointByVietnamDay(new Date('2026-07-30T17:00:30.000Z'), 60),
    ).toEqual([
      {
        learnedOn: new Date('2026-07-30T00:00:00.000Z'),
        seconds: 30,
      },
      {
        learnedOn: new Date('2026-07-31T00:00:00.000Z'),
        seconds: 30,
      },
    ]);
  });

  it('rejects a short heartbeat checkpoint', async () => {
    const { service } = createService();

    await expect(
      service.submitCheckpoint('user-id', {
        activityType: LearningActivityType.TEST_PRACTICE,
        kind: 'heartbeat',
        elapsedSeconds: 44,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns every activity mode in one calendar query', async () => {
    const { prisma, service } = createService();
    prisma.userLearningDaily.findMany.mockResolvedValue([
      {
        activityType: LearningActivityType.TEST_PRACTICE,
        learnedOn: new Date('2026-07-29T00:00:00.000Z'),
        seconds: 120,
      },
      {
        activityType: LearningActivityType.DICTATION,
        learnedOn: new Date('2026-07-30T00:00:00.000Z'),
        seconds: 60,
      },
    ]);

    await expect(service.getCalendar('user-id')).resolves.toEqual({
      days: [
        {
          activityType: LearningActivityType.TEST_PRACTICE,
          learnedOn: '2026-07-29',
          seconds: 120,
        },
        {
          activityType: LearningActivityType.DICTATION,
          learnedOn: '2026-07-30',
          seconds: 60,
        },
      ],
    });

    expect(prisma.userLearningDaily.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      select: {
        activityType: true,
        learnedOn: true,
        seconds: true,
      },
      orderBy: { learnedOn: 'asc' },
    });
  });

  it('increments the selected activity type atomically', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-30T10:00:00.000Z'));
    const { prisma, service } = createService();

    try {
      await expect(
        service.submitCheckpoint('user-id', {
          activityType: LearningActivityType.TEST_REVIEW_WRONG,
          kind: 'heartbeat',
          elapsedSeconds: 60,
        }),
      ).resolves.toEqual({ acceptedSeconds: 60 });

      expect(prisma.userLearningDaily.upsert).toHaveBeenCalledWith({
        where: {
          userId_learnedOn_activityType: {
            userId: 'user-id',
            learnedOn: new Date('2026-07-30T00:00:00.000Z'),
            activityType: LearningActivityType.TEST_REVIEW_WRONG,
          },
        },
        create: {
          userId: 'user-id',
          learnedOn: new Date('2026-07-30T00:00:00.000Z'),
          activityType: LearningActivityType.TEST_REVIEW_WRONG,
          seconds: 60,
        },
        update: {
          seconds: { increment: 60 },
        },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

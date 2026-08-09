import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { SubmitLearningActivityCheckpointDto } from '../api/dto/submit-learning-activity-checkpoint.dto';

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

type DailyIncrement = {
  learnedOn: Date;
  seconds: number;
};

function getVietnamDayStart(date: Date) {
  const localDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);

  return new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
    ) - VIETNAM_UTC_OFFSET_MS,
  );
}

function getVietnamDayValue(date: Date) {
  const localDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);

  return new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
    ),
  );
}

export function splitCheckpointByVietnamDay(
  receivedAt: Date,
  elapsedSeconds: number,
): DailyIncrement[] {
  const startedAt = new Date(receivedAt.getTime() - elapsedSeconds * 1000);
  const dayEnd = new Date(
    getVietnamDayStart(startedAt).getTime() + 24 * 60 * 60 * 1000,
  );

  if (receivedAt < dayEnd) {
    return [
      { learnedOn: getVietnamDayValue(receivedAt), seconds: elapsedSeconds },
    ];
  }

  const firstDaySeconds = Math.round(
    (dayEnd.getTime() - startedAt.getTime()) / 1000,
  );

  return [
    { learnedOn: getVietnamDayValue(startedAt), seconds: firstDaySeconds },
    {
      learnedOn: getVietnamDayValue(receivedAt),
      seconds: elapsedSeconds - firstDaySeconds,
    },
  ].filter((increment) => increment.seconds > 0);
}

@Injectable()
export class LearningActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(userId: string) {
    const days = await this.prisma.userLearningDaily.findMany({
      where: { userId },
      select: {
        activityType: true,
        learnedOn: true,
        seconds: true,
      },
      orderBy: { learnedOn: 'asc' },
    });

    return {
      days: days.map((day) => ({
        activityType: day.activityType,
        learnedOn: day.learnedOn.toISOString().slice(0, 10),
        seconds: day.seconds,
      })),
    };
  }

  async submitCheckpoint(
    userId: string,
    dto: SubmitLearningActivityCheckpointDto,
  ) {
    if (dto.kind === 'heartbeat' && dto.elapsedSeconds < 45) {
      throw new BadRequestException(
        'Heartbeat checkpoints must contain at least 45 seconds.',
      );
    }

    const increments = splitCheckpointByVietnamDay(
      new Date(),
      dto.elapsedSeconds,
    );

    await this.prisma.$transaction(
      increments.map(({ learnedOn, seconds }) =>
        this.prisma.userLearningDaily.upsert({
          where: {
            userId_learnedOn_activityType: {
              userId,
              learnedOn,
              activityType: dto.activityType,
            },
          },
          create: {
            userId,
            learnedOn,
            activityType: dto.activityType,
            seconds,
          },
          update: {
            seconds: { increment: seconds },
          },
        }),
      ),
    );

    return { acceptedSeconds: dto.elapsedSeconds };
  }
}

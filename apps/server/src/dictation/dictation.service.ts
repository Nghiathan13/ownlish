import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitDictationAnswerDto } from './dto/submit-dictation-answer.dto';

type DictationProgressRecord = {
  videoId: string;
  answeredSegmentIds: string[];
  correctCount: number;
  completedAt: Date | null;
  updatedAt: Date;
};

function formatProgress(progress: DictationProgressRecord) {
  return {
    videoId: progress.videoId,
    answeredSegmentIds: progress.answeredSegmentIds,
    correctCount: progress.correctCount,
    completedAt: progress.completedAt?.toISOString() ?? null,
    updatedAt: progress.updatedAt.toISOString(),
  };
}

@Injectable()
export class DictationService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string, videoId: string) {
    const progress = await this.prisma.dictationProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    return progress ? formatProgress(progress) : null;
  }

  async submitAnswer(
    userId: string,
    videoId: string,
    dto: SubmitDictationAnswerDto,
  ) {
    const completedAt = dto.isCompleted ? new Date() : null;

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`dictation:${videoId}`}))`,
      );
      const existing = await tx.dictationProgress.findUnique({
        where: { userId_videoId: { userId, videoId } },
      });

      if (!existing) {
        const created = await tx.dictationProgress.create({
          data: {
            userId,
            videoId,
            answeredSegmentIds: [dto.segmentId],
            correctCount: 1,
            completedAt,
          },
        });

        return formatProgress(created);
      }

      if (existing.answeredSegmentIds.includes(dto.segmentId)) {
        return formatProgress(existing);
      }

      const answeredSegmentIds = [
        ...existing.answeredSegmentIds,
        dto.segmentId,
      ];
      const updated = await tx.dictationProgress.update({
        where: { userId_videoId: { userId, videoId } },
        data: {
          answeredSegmentIds,
          correctCount: answeredSegmentIds.length,
          completedAt,
        },
      });

      return formatProgress(updated);
    });
  }

  async resetProgress(userId: string, videoId: string) {
    await this.prisma.dictationProgress.deleteMany({
      where: { userId, videoId },
    });
  }
}

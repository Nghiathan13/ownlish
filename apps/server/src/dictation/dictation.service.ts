import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  EXPERIENCE_AWARDER,
  noExperienceAwards,
  type ExperienceAwarder,
} from '../features/experience/experience-awarder';
import { PrismaService } from '../prisma/prisma.service';
import { isDictationAnswerCorrect } from '../features/dictation-catalog/model/dictation-answer';
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
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXPERIENCE_AWARDER)
    private readonly experienceAwarder: ExperienceAwarder = noExperienceAwards,
  ) {}

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
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`dictation:${videoId}`}))`,
      );
      const existing = await tx.dictationProgress.findUnique({
        where: { userId_videoId: { userId, videoId } },
      });
      const segment = await tx.dictationCatalogSegment.findUnique({
        where: { videoId_segmentId: { videoId, segmentId: dto.segmentId } },
      });
      if (!segment) {
        throw new NotFoundException('Dictation segment not found.');
      }
      if (!isDictationAnswerCorrect(dto.answer, segment.transcript)) {
        throw new BadRequestException('Dictation answer is incorrect.');
      }
      const video = await tx.dictationCatalogVideo.findUnique({
        where: { videoId },
        select: { segmentCount: true },
      });
      if (!video) {
        throw new NotFoundException('Dictation video not found.');
      }

      if (!existing) {
        const completedAt = video.segmentCount === 1 ? new Date() : null;
        const created = await tx.dictationProgress.create({
          data: {
            userId,
            videoId,
            answeredSegmentIds: [dto.segmentId],
            correctCount: 1,
            completedAt,
          },
        });
        await this.experienceAwarder.award(tx, {
          type: 'dictation-segment',
          userId,
          videoId,
          segmentId: dto.segmentId,
        });
        if (completedAt) {
          await this.experienceAwarder.award(tx, {
            type: 'dictation-video',
            userId,
            videoId,
          });
        }

        return formatProgress(created);
      }

      if (existing.answeredSegmentIds.includes(dto.segmentId)) {
        return formatProgress(existing);
      }

      const answeredSegmentIds = [
        ...existing.answeredSegmentIds,
        dto.segmentId,
      ];
      const completedAt =
        existing.completedAt ??
        (answeredSegmentIds.length === video.segmentCount ? new Date() : null);
      const updated = await tx.dictationProgress.update({
        where: { userId_videoId: { userId, videoId } },
        data: {
          answeredSegmentIds,
          correctCount: answeredSegmentIds.length,
          completedAt,
        },
      });
      await this.experienceAwarder.award(tx, {
        type: 'dictation-segment',
        userId,
        videoId,
        segmentId: dto.segmentId,
      });
      if (!existing.completedAt && completedAt) {
        await this.experienceAwarder.award(tx, {
          type: 'dictation-video',
          userId,
          videoId,
        });
      }

      return formatProgress(updated);
    });
  }

  async resetProgress(userId: string, videoId: string) {
    await this.prisma.dictationProgress.deleteMany({
      where: { userId, videoId },
    });
  }
}

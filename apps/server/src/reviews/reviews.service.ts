import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OXFORD_CEFR_LEVELS,
  OXFORD_DEFINITION_SOURCES,
} from '../collections/collections.constants';
import { type ReviewRating, scheduleReview } from './lib/review-schedule';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOxfordPart(userId: string, band: string, part: number) {
    this.assertOxfordPart(band, part);
    const now = new Date();

    const entries = await this.prisma.systemVocabularyEntry.findMany({
      where: {
        band,
        source: { in: OXFORD_DEFINITION_SOURCES },
      },
      include: {
        progress: {
          where: { userId },
          select: {
            level: true,
            wrongCount: true,
            lastReviewAt: true,
            nextReviewAt: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
      skip: this.getOxfordPartOffset(part),
      take: 20,
    });

    if (entries.length === 0) {
      throw new NotFoundException('Oxford part not found');
    }

    const items = entries.flatMap((entry) => {
      const progress = entry.progress[0] ?? null;

      if (
        progress?.level === 7 ||
        (progress?.nextReviewAt && progress.nextReviewAt > now)
      ) {
        return [];
      }

      return [
        {
          id: entry.id,
          word: entry.word,
          normalizedWord: entry.normalizedWord,
          definition: {
            id: entry.id,
            type: entry.type,
            meaningVi: entry.meaningVi,
            definition: entry.definition,
            example: entry.example,
            exampleVi: entry.exampleVi,
            ipaUk: entry.ipaUk,
            ipaUs: entry.ipaUs,
            band: entry.band,
            source: entry.source,
          },
          progress,
        },
      ];
    });

    return {
      items,
      limit: 20,
      offset: this.getOxfordPartOffset(part),
    };
  }

  async gradeOxfordDefinition(
    userId: string,
    band: string,
    part: number,
    definitionId: string,
    rating: ReviewRating,
  ) {
    this.assertOxfordPart(band, part);

    const partEntries = await this.prisma.systemVocabularyEntry.findMany({
      where: {
        band,
        source: { in: OXFORD_DEFINITION_SOURCES },
      },
      select: { id: true },
      orderBy: { sortOrder: 'asc' },
      skip: this.getOxfordPartOffset(part),
      take: 20,
    });

    if (!partEntries.some((entry) => entry.id === definitionId)) {
      throw new NotFoundException('Oxford word not found in this part');
    }

    const existingProgress =
      await this.prisma.userSystemVocabularyProgress.findUnique({
        where: {
          userId_systemEntryId: {
            userId,
            systemEntryId: definitionId,
          },
        },
        select: { level: true, wrongCount: true },
      });
    const progress = scheduleReview(
      {
        level: existingProgress?.level ?? 0,
        wrongCount: existingProgress?.wrongCount ?? 0,
      },
      rating,
    );

    return this.prisma.userSystemVocabularyProgress.upsert({
      where: {
        userId_systemEntryId: {
          userId,
          systemEntryId: definitionId,
        },
      },
      create: {
        userId,
        systemEntryId: definitionId,
        level: progress.level,
        wrongCount: progress.wrongCount,
        lastReviewAt: progress.lastReviewAt,
        nextReviewAt: progress.nextReviewAt,
      },
      update: {
        level: progress.level,
        wrongCount: progress.wrongCount,
        lastReviewAt: progress.lastReviewAt,
        nextReviewAt: progress.nextReviewAt,
      },
      select: {
        level: true,
        wrongCount: true,
        lastReviewAt: true,
        nextReviewAt: true,
      },
    });
  }

  private assertOxfordPart(band: string, part: number) {
    if (!OXFORD_CEFR_LEVELS.includes(band)) {
      throw new BadRequestException('Unsupported Oxford band');
    }

    if (!Number.isSafeInteger(part) || part < 1) {
      throw new BadRequestException('Oxford part must be positive');
    }
  }

  private getOxfordPartOffset(part: number) {
    return (part - 1) * 20;
  }
}

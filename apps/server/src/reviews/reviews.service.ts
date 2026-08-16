import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReviewGradeSource } from '@prisma/client';
import {
  EXPERIENCE_AWARDER,
  noExperienceAwards,
  type ExperienceAwarder,
} from '../features/experience/experience-awarder';
import {
  EXPERIENCE_REVIEW_RECEIPTS,
  noExperienceReviewReceipts,
  type ExperienceReviewReceipts,
} from '../features/experience/experience-review-receipts';
import { PrismaService } from '../prisma/prisma.service';
import { GradeOxfordWordDto } from './dto/grade-oxford-word.dto';
import {
  OXFORD_CEFR_LEVELS,
  OXFORD_DEFINITION_SOURCES,
} from '../collections/collections.constants';
import { scheduleReview } from './lib/review-schedule';

type DifficultReviewWord = {
  word: string;
  collectionName: string;
  wrongCount: number;
};

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXPERIENCE_AWARDER)
    private readonly experienceAwarder: ExperienceAwarder = noExperienceAwards,
    @Inject(EXPERIENCE_REVIEW_RECEIPTS)
    private readonly experienceReviewReceipts: ExperienceReviewReceipts = noExperienceReviewReceipts,
  ) {}

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

  async listDifficultWords(
    userId: string,
    source: 'collection' | 'oxford' = 'collection',
  ): Promise<DifficultReviewWord[]> {
    if (source === 'oxford') {
      return this.prisma.$queryRaw<DifficultReviewWord[]>`
        SELECT
          entry."word" AS "word",
          'Oxford' AS "collectionName",
          progress."wrong_count" AS "wrongCount"
        FROM "user_system_vocabulary_progress" progress
        INNER JOIN "system_vocabulary_entries" entry
          ON entry."id" = progress."system_entry_id"
        WHERE progress."user_id" = ${userId}
          AND entry."source" IN ('oxford_3000', 'oxford_5000')
          AND progress."wrong_count" > 3
        ORDER BY "wrongCount" DESC, "word" ASC
        LIMIT 20
      `;
    }

    return this.prisma.$queryRaw<DifficultReviewWord[]>`
      SELECT
        entry."word" AS "word",
        collection."name" AS "collectionName",
        entry."wrong_count" AS "wrongCount"
      FROM "user_vocabulary_entries" entry
      INNER JOIN "word_collections" collection
        ON collection."id" = entry."collection_id"
      WHERE entry."user_id" = ${userId}
        AND collection."owner_user_id" = ${userId}
        AND entry."wrong_count" > 3
      ORDER BY "wrongCount" DESC, "word" ASC
      LIMIT 20
    `;
  }

  async gradeOxfordDefinition(
    userId: string,
    band: string,
    part: number,
    definitionId: string,
    dto: GradeOxfordWordDto,
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

    return this.prisma.$transaction(async (tx) => {
      const receipt = {
        userId,
        submissionId: dto.submissionId,
        source: ReviewGradeSource.OXFORD,
        subjectId: definitionId,
      };
      if (await this.experienceReviewReceipts.isDuplicate(tx, receipt)) {
        return this.getOxfordProgress(tx, userId, definitionId);
      }

      const existingProgress = await tx.userSystemVocabularyProgress.findUnique(
        {
          where: {
            userId_systemEntryId: { userId, systemEntryId: definitionId },
          },
          select: { level: true, wrongCount: true },
        },
      );
      const progress = scheduleReview(
        {
          level: existingProgress?.level ?? 0,
          wrongCount: existingProgress?.wrongCount ?? 0,
        },
        dto.rating,
      );
      const updated = await tx.userSystemVocabularyProgress.upsert({
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
      await this.experienceReviewReceipts.record(tx, receipt);
      if (
        dto.rating === 'EASY' &&
        progress.level > (existingProgress?.level ?? 0)
      ) {
        await this.experienceAwarder.award(tx, {
          type: 'review-easy',
          userId,
          source: 'oxford',
          subjectId: definitionId,
        });
      }

      return updated;
    });
  }

  private getOxfordProgress(
    client: Prisma.TransactionClient,
    userId: string,
    definitionId: string,
  ) {
    return client.userSystemVocabularyProgress.findUnique({
      where: { userId_systemEntryId: { userId, systemEntryId: definitionId } },
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

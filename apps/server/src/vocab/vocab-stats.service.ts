import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  HIGH_WRONG_COUNT_THRESHOLD,
  MAX_VOCAB_LEVEL,
  MIN_VOCAB_LEVEL,
} from './vocab.constants';

type VocabStatsResponse = {
  total: number;
  due: number;
  mastered: number;
  highWrongCount: number;
  levels: Array<{
    level: number;
    count: number;
  }>;
};

type RawVocabStatsRow = {
  total: number;
  due: number;
  mastered: number;
  high_wrong_count: number;
  levels: Array<{
    level: number;
    count: number;
  }> | null;
};

@Injectable()
export class VocabStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(
    userId: string,
    collectionId: string,
  ): Promise<VocabStatsResponse> {
    await this.assertOwnedCollection(userId, collectionId);

    const now = new Date();
    const [stats] = await this.prisma.$queryRaw<RawVocabStatsRow[]>`
      WITH active AS (
        SELECT
          "level",
          "wrong_count",
          "next_review"
        FROM "user_vocabulary_entries"
        WHERE "user_id" = ${userId}
          AND "collection_id" = ${collectionId}
      ),
      summary AS (
        SELECT
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (
            WHERE "level" < ${MAX_VOCAB_LEVEL}
              AND ("next_review" IS NULL OR "next_review" <= ${now})
          )::int AS "due",
          COUNT(*) FILTER (WHERE "level" = ${MAX_VOCAB_LEVEL})::int AS "mastered",
          COUNT(*) FILTER (
            WHERE "wrong_count" >= ${HIGH_WRONG_COUNT_THRESHOLD}
          )::int AS "high_wrong_count"
        FROM active
      ),
      level_counts AS (
        SELECT "level", COUNT(*)::int AS "count"
        FROM active
        GROUP BY "level"
      )
      SELECT
        summary."total",
        summary."due",
        summary."mastered",
        summary."high_wrong_count",
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'level', level_counts."level",
              'count', level_counts."count"
            )
            ORDER BY level_counts."level"
          ) FILTER (WHERE level_counts."level" IS NOT NULL),
          '[]'::jsonb
        ) AS "levels"
      FROM summary
      LEFT JOIN level_counts ON true
      GROUP BY
        summary."total",
        summary."due",
        summary."mastered",
        summary."high_wrong_count"
    `;
    const levelCountByLevel = new Map(
      (stats?.levels ?? []).map((row) => [row.level, row.count]),
    );

    return {
      total: stats?.total ?? 0,
      due: stats?.due ?? 0,
      mastered: stats?.mastered ?? 0,
      highWrongCount: stats?.high_wrong_count ?? 0,
      levels: Array.from(
        { length: MAX_VOCAB_LEVEL - MIN_VOCAB_LEVEL + 1 },
        (_, index) => {
          const level = MIN_VOCAB_LEVEL + index;

          return {
            level,
            count: levelCountByLevel.get(level) ?? 0,
          };
        },
      ),
    };
  }

  private async assertOwnedCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.wordCollection.findFirst({
      where: {
        id: collectionId,
        ownerUserId: userId,
      },
      select: { id: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }
}

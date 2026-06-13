import { Injectable } from '@nestjs/common';
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

  async getStats(userId: string): Promise<VocabStatsResponse> {
    const now = new Date();
    const [stats] = await this.prisma.$queryRaw<RawVocabStatsRow[]>`
      WITH active AS (
        SELECT
          "definition"."level",
          "definition"."wrong_count",
          "definition"."next_review"
        FROM "vocab_word_definitions" AS "definition"
        INNER JOIN "vocab_words" AS "word"
          ON "word"."id" = "definition"."vocab_word_id"
        WHERE "word"."user_id" = ${userId}
          AND "definition"."deleted_at" IS NULL
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
}

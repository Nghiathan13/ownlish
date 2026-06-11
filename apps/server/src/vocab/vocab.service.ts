import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVocabWordDto } from './dto/create-vocab-word.dto';
import { ListDueReviewWordsDto } from './dto/list-due-review-words.dto';
import { ListVocabWordsDto } from './dto/list-vocab-words.dto';
import { UpdateVocabWordDto } from './dto/update-vocab-word.dto';
import { UpdateVocabReviewDto } from './dto/update-vocab-review.dto';
import { normalizeWord } from './lib/normalize-word';
import {
  HIGH_WRONG_COUNT_THRESHOLD,
  MAX_VOCAB_LEVEL,
  MIN_VOCAB_LEVEL,
} from './vocab.constants';

type VocabWordResult = ReturnType<PrismaService['vocabWord']['findFirst']>;
type VocabWordList = Awaited<
  ReturnType<PrismaService['vocabWord']['findMany']>
>;
type CreatedVocabWordResult = ReturnType<PrismaService['vocabWord']['create']>;
type UpdatedVocabWordResult = ReturnType<PrismaService['vocabWord']['update']>;
type VocabWordListResponse = {
  items: VocabWordList;
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};
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
export class VocabService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListVocabWordsDto = {},
  ): Promise<VocabWordListResponse> {
    const search = query.search?.trim();
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where = {
      userId,
      deletedAt: null,
      ...(search
        ? {
            normalizedWord: {
              contains: normalizeWord(search),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.vocabWord.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.vocabWord.count({
        where,
      }),
    ]);

    return {
      items,
      meta: {
        limit,
        offset,
        total,
        hasMore: offset + items.length < total,
      },
    };
  }

  async listDueReviewWords(
    userId: string,
    query: ListDueReviewWordsDto = {},
  ): Promise<VocabWordListResponse> {
    const limit = query.limit ?? 500;
    const offset = query.offset ?? 0;
    const where = {
      userId,
      deletedAt: null,
      level: {
        lt: MAX_VOCAB_LEVEL,
      },
      OR: [
        {
          nextReview: null,
        },
        {
          nextReview: {
            lte: new Date(),
          },
        },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.vocabWord.findMany({
        where,
        orderBy: [
          {
            nextReview: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.vocabWord.count({
        where,
      }),
    ]);

    return {
      items,
      meta: {
        limit,
        offset,
        total,
        hasMore: offset + items.length < total,
      },
    };
  }

  async getStats(userId: string): Promise<VocabStatsResponse> {
    const now = new Date();
    const [stats] = await this.prisma.$queryRaw<RawVocabStatsRow[]>`
      WITH active AS (
        SELECT "level", "wrong_count", "next_review"
        FROM "vocab_words"
        WHERE "user_id" = ${userId}
          AND "deleted_at" IS NULL
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

  get(userId: string, id: string): Promise<Awaited<VocabWordResult>> {
    return this.findActiveWordOrThrow(userId, id);
  }

  async create(
    userId: string,
    dto: CreateVocabWordDto,
  ): Promise<Awaited<CreatedVocabWordResult>> {
    const word = this.normalizeRequiredWord(dto.word);
    const normalizedWord = normalizeWord(word);

    try {
      return await this.prisma.vocabWord.create({
        data: {
          ...dto,
          userId,
          normalizedWord,
          word,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Word already exists');
      }

      throw error;
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateVocabWordDto,
  ): Promise<Awaited<UpdatedVocabWordResult>> {
    await this.findActiveWordOrThrow(userId, id);

    const data = {
      ...dto,
      ...this.buildWordUpdateData(dto.word),
    };

    try {
      return await this.prisma.vocabWord.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Word already exists');
      }

      throw error;
    }
  }

  async updateReview(
    userId: string,
    id: string,
    dto: UpdateVocabReviewDto,
  ): Promise<Awaited<UpdatedVocabWordResult>> {
    await this.findActiveWordOrThrow(userId, id);

    return this.prisma.vocabWord.update({
      where: { id },
      data: {
        level: dto.level,
        wrongCount: dto.wrongCount,
        lastReview: new Date(dto.lastReview),
        nextReview: dto.nextReview ? new Date(dto.nextReview) : null,
      },
    });
  }

  async softDelete(
    userId: string,
    id: string,
  ): Promise<Awaited<UpdatedVocabWordResult>> {
    await this.findActiveWordOrThrow(userId, id);

    return this.prisma.vocabWord.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private async findActiveWordOrThrow(
    userId: string,
    id: string,
  ): Promise<Awaited<VocabWordResult>> {
    const word = await this.prisma.vocabWord.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }

  private normalizeRequiredWord(word: string) {
    const normalizedWord = word.trim();

    if (!normalizedWord) {
      throw new BadRequestException('Word is required');
    }

    return normalizedWord;
  }

  private buildWordUpdateData(word?: string) {
    if (!word) {
      return {};
    }

    const normalizedWord = this.normalizeRequiredWord(word);

    return {
      word: normalizedWord,
      normalizedWord: normalizeWord(normalizedWord),
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVocabWordDto } from './dto/create-vocab-word.dto';
import { ListVocabWordsDto } from './dto/list-vocab-words.dto';
import { UpdateVocabWordDto } from './dto/update-vocab-word.dto';
import { UpdateVocabReviewDto } from './dto/update-vocab-review.dto';
import { normalizeWord } from './lib/normalize-word';

type VocabWordResult = ReturnType<PrismaService['vocabWord']['findFirst']>;
type VocabWordListResult = ReturnType<PrismaService['vocabWord']['findMany']>;
type CreatedVocabWordResult = ReturnType<PrismaService['vocabWord']['create']>;
type UpdatedVocabWordResult = ReturnType<PrismaService['vocabWord']['update']>;
type VocabWordListResponse = {
  items: Awaited<VocabWordListResult>;
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
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
              mode: 'insensitive' as const,
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

  listDueReviewWords(userId: string): VocabWordListResult {
    return this.prisma.vocabWord.findMany({
      where: {
        userId,
        deletedAt: null,
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
      },
      orderBy: [
        {
          nextReview: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
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
        nextReview: new Date(dto.nextReview),
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

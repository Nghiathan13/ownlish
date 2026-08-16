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
import { OXFORD_DEFINITION_SOURCES } from '../collections/collections.constants';
import { scheduleReview } from '../reviews/lib/review-schedule';
import { CreateVocabWordDto } from './dto/create-vocab-word.dto';
import { ListDueReviewWordsDto } from './dto/list-due-review-words.dto';
import { ListVocabWordsDto } from './dto/list-vocab-words.dto';
import { UpdateVocabReviewDto } from './dto/update-vocab-review.dto';
import { UpdateVocabWordDto } from './dto/update-vocab-word.dto';
import { normalizeWord } from './lib/normalize-word';
import { MAX_VOCAB_LEVEL } from './vocab.constants';

type VocabularyEntry = Awaited<
  ReturnType<PrismaService['userVocabularyEntry']['findFirst']>
>;
type ActiveVocabularyEntry = NonNullable<VocabularyEntry>;
type VocabularyEntryList = Awaited<
  ReturnType<PrismaService['userVocabularyEntry']['findMany']>
>;
type ListResponse<TItems> = {
  items: TItems;
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

function buildListResponse<TItems extends { length: number }>(
  items: TItems,
  limit: number,
  offset: number,
  total: number,
): ListResponse<TItems> {
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

@Injectable()
export class VocabService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXPERIENCE_AWARDER)
    private readonly experienceAwarder: ExperienceAwarder = noExperienceAwards,
    @Inject(EXPERIENCE_REVIEW_RECEIPTS)
    private readonly experienceReviewReceipts: ExperienceReviewReceipts = noExperienceReviewReceipts,
  ) {}

  async list(
    userId: string,
    query: ListVocabWordsDto,
  ): Promise<ListResponse<VocabularyEntryList>> {
    await this.assertOwnedCollection(userId, query.collectionId);

    const search = query.search?.trim();
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where = {
      userId,
      collectionId: query.collectionId,
      ...(search
        ? {
            normalizedWord: {
              contains: normalizeWord(search),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.userVocabularyEntry.findMany({
        where,
        orderBy: [{ word: 'asc' }, { createdAt: 'asc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.userVocabularyEntry.count({ where }),
    ]);

    return buildListResponse(items, limit, offset, total);
  }

  async listDueReviewWords(
    userId: string,
    query: ListDueReviewWordsDto,
  ): Promise<ListResponse<VocabularyEntryList>> {
    await this.assertOwnedCollection(userId, query.collectionId);

    const limit = query.limit ?? 1000;
    const offset = query.offset ?? 0;
    const where = {
      userId,
      collectionId: query.collectionId,
      level: { lt: MAX_VOCAB_LEVEL },
      OR: [{ nextReview: null }, { nextReview: { lte: new Date() } }],
    };

    const [items, total] = await Promise.all([
      this.prisma.userVocabularyEntry.findMany({
        where,
        orderBy: [{ nextReview: 'asc' }, { createdAt: 'asc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.userVocabularyEntry.count({ where }),
    ]);

    return buildListResponse(items, limit, offset, total);
  }

  async get(userId: string, id: string): Promise<ActiveVocabularyEntry> {
    return this.findEntryOrThrow(userId, id);
  }

  async create(
    userId: string,
    dto: CreateVocabWordDto,
  ): Promise<
    Awaited<ReturnType<PrismaService['userVocabularyEntry']['create']>>
  > {
    await this.assertOwnedCollection(userId, dto.collectionId);
    const word = this.normalizeRequiredWord(dto.word);

    return this.prisma.userVocabularyEntry.create({
      data: {
        userId,
        collectionId: dto.collectionId,
        word,
        normalizedWord: normalizeWord(word),
        ...this.buildManualEntryData(dto),
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateVocabWordDto,
  ): Promise<
    Awaited<ReturnType<PrismaService['userVocabularyEntry']['update']>>
  > {
    const entry = await this.findEntryOrThrow(userId, id);
    const isOxfordEntry = OXFORD_DEFINITION_SOURCES.includes(entry.source);

    return this.prisma.userVocabularyEntry.update({
      where: { id: entry.id },
      data: {
        ...(dto.word !== undefined && !isOxfordEntry
          ? this.buildWordUpdateData(dto.word)
          : {}),
        ...this.buildEntryUpdateData(dto),
      },
    });
  }

  async updateReview(
    userId: string,
    id: string,
    dto: UpdateVocabReviewDto,
  ): Promise<
    Awaited<ReturnType<PrismaService['userVocabularyEntry']['update']>>
  > {
    return this.prisma.$transaction(async (tx) => {
      const receipt = {
        userId,
        submissionId: dto.submissionId,
        source: ReviewGradeSource.USER_VOCAB,
        subjectId: id,
      };
      if (await this.experienceReviewReceipts.isDuplicate(tx, receipt)) {
        return this.findEntryOrThrowWithClient(tx, userId, id);
      }

      const entry = await this.findEntryOrThrowWithClient(tx, userId, id);
      const progress = scheduleReview(
        { level: entry.level, wrongCount: entry.wrongCount },
        dto.rating,
      );
      const updated = await tx.userVocabularyEntry.update({
        where: { id: entry.id },
        data: {
          level: progress.level,
          wrongCount: progress.wrongCount,
          lastReview: progress.lastReviewAt,
          nextReview: progress.nextReviewAt,
        },
      });
      await this.experienceReviewReceipts.record(tx, receipt);
      if (dto.rating === 'EASY' && progress.level > entry.level) {
        await this.experienceAwarder.award(tx, {
          type: 'review-easy',
          userId,
          source: 'user-vocab',
          subjectId: id,
        });
      }

      return updated;
    });
  }

  async delete(
    userId: string,
    id: string,
  ): Promise<{ deletedEntryId: string }> {
    const entry = await this.findEntryOrThrow(userId, id);

    await this.prisma.userVocabularyEntry.delete({ where: { id: entry.id } });

    return { deletedEntryId: entry.id };
  }

  private async findEntryOrThrow(
    userId: string,
    id: string,
  ): Promise<ActiveVocabularyEntry> {
    const entry = await this.prisma.userVocabularyEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new NotFoundException('Vocabulary entry not found');
    }

    return entry;
  }

  private async findEntryOrThrowWithClient(
    client: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const entry = await client.userVocabularyEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new NotFoundException('Vocabulary entry not found');
    }

    return entry;
  }

  private normalizeRequiredWord(word: string) {
    const normalizedWord = word.trim();

    if (!normalizedWord) {
      throw new BadRequestException('Word is required');
    }

    return normalizedWord;
  }

  private buildWordUpdateData(word: string) {
    const normalizedWord = this.normalizeRequiredWord(word);

    return {
      word: normalizedWord,
      normalizedWord: normalizeWord(normalizedWord),
    };
  }

  private buildManualEntryData(input: CreateVocabWordDto) {
    return {
      source: 'manual',
      type: normalizeOptionalText(input.type),
      meaningVi: normalizeOptionalText(input.meaningVi),
      definition: normalizeOptionalText(input.definition),
      example: normalizeOptionalText(input.example),
      exampleVi: normalizeOptionalText(input.exampleVi),
      ipaUk: normalizeOptionalText(input.ipaUk),
      ipaUs: normalizeOptionalText(input.ipaUs),
      band: normalizeOptionalText(input.band),
      level: input.level ?? 0,
      wrongCount: input.wrongCount ?? 0,
    };
  }

  private buildEntryUpdateData(input: UpdateVocabWordDto) {
    return {
      ...(input.type !== undefined
        ? { type: normalizeOptionalText(input.type) }
        : {}),
      ...(input.meaningVi !== undefined
        ? { meaningVi: normalizeOptionalText(input.meaningVi) }
        : {}),
      ...(input.definition !== undefined
        ? { definition: normalizeOptionalText(input.definition) }
        : {}),
      ...(input.example !== undefined
        ? { example: normalizeOptionalText(input.example) }
        : {}),
      ...(input.exampleVi !== undefined
        ? { exampleVi: normalizeOptionalText(input.exampleVi) }
        : {}),
      ...(input.ipaUk !== undefined
        ? { ipaUk: normalizeOptionalText(input.ipaUk) }
        : {}),
      ...(input.ipaUs !== undefined
        ? { ipaUs: normalizeOptionalText(input.ipaUs) }
        : {}),
      ...(input.band !== undefined
        ? { band: normalizeOptionalText(input.band) }
        : {}),
      ...(input.level !== undefined ? { level: input.level } : {}),
      ...(input.wrongCount !== undefined
        ? { wrongCount: input.wrongCount }
        : {}),
    };
  }

  private async assertOwnedCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.wordCollection.findFirst({
      where: { id: collectionId, ownerUserId: userId },
      select: { id: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }
}

function normalizeOptionalText(value?: string) {
  const trimmedValue = value?.trim();

  return trimmedValue || null;
}

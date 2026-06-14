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
import type { DeleteVocabDefinitionResponse } from './types/delete-vocab-definition-response.types';
import { OXFORD_DEFINITION_SOURCES } from '../collections/collections.constants';
import { normalizeWord } from './lib/normalize-word';
import { MAX_VOCAB_LEVEL } from './vocab.constants';

const activeDefinitionsInclude = {
  definitions: {
    where: {
      deletedAt: null,
    },
    orderBy: [
      { source: 'asc' as const },
      { type: 'asc' as const },
      { createdAt: 'asc' as const },
    ],
  },
};

const reviewDefinitionInclude = {
  vocabWord: true,
};

type VocabWordResult = ReturnType<PrismaService['vocabWord']['findFirst']>;
type VocabWordList = Awaited<
  ReturnType<PrismaService['vocabWord']['findMany']>
>;
type CreatedVocabWordResult = ReturnType<PrismaService['vocabWord']['create']>;
type UpdatedVocabWordResult = ReturnType<PrismaService['vocabWord']['update']>;
type ReviewDefinitionResult = ReturnType<
  PrismaService['vocabWordDefinition']['findFirst']
>;
type ActiveReviewDefinitionResult = NonNullable<Awaited<ReviewDefinitionResult>>;
type ReviewDefinitionList = Awaited<
  ReturnType<PrismaService['vocabWordDefinition']['findMany']>
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
type VocabWordListResponse = ListResponse<VocabWordList>;
type ReviewDefinitionListResponse = ListResponse<ReviewDefinitionList>;

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
      definitions: {
        some: {
          deletedAt: null,
        },
      },
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
        include: activeDefinitionsInclude,
        orderBy: {
          word: 'asc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.vocabWord.count({
        where,
      }),
    ]);

    return buildListResponse(items, limit, offset, total);
  }

  async listDueReviewWords(
    userId: string,
    query: ListDueReviewWordsDto = {},
  ): Promise<ReviewDefinitionListResponse> {
    const limit = query.limit ?? 500;
    const offset = query.offset ?? 0;
    const where = {
      deletedAt: null,
      level: {
        lt: MAX_VOCAB_LEVEL,
      },
      vocabWord: {
        userId,
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
      this.prisma.vocabWordDefinition.findMany({
        where,
        include: reviewDefinitionInclude,
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
      this.prisma.vocabWordDefinition.count({
        where,
      }),
    ]);

    return buildListResponse(items, limit, offset, total);
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
    const existingWord = await this.prisma.vocabWord.findFirst({
      where: {
        userId,
        normalizedWord,
      },
      include: activeDefinitionsInclude,
    });

    if (existingWord) {
      return this.addManualDefinitionToExistingWord(existingWord, dto);
    }

    return this.prisma.vocabWord.create({
      data: {
        userId,
        normalizedWord,
        word,
        definitions: {
          create: this.buildManualDefinitionData(dto),
        },
      },
      include: activeDefinitionsInclude,
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateVocabWordDto,
  ): Promise<Awaited<UpdatedVocabWordResult>> {
    await this.findActiveWordOrThrow(userId, id);

    let wordUpdateData = this.buildWordUpdateData(dto.word);

    if (dto.word !== undefined && dto.definitionId) {
      const targetDefinition = await this.resolveDefinitionForUpdate(
        userId,
        id,
        dto.definitionId,
      );

      if (this.isOxfordDefinitionSource(targetDefinition.source)) {
        wordUpdateData = {};
      }
    }

    try {
      if (Object.keys(wordUpdateData).length > 0) {
        await this.prisma.vocabWord.update({
          where: { id },
          data: wordUpdateData,
        });
      }

      if (this.hasDefinitionInput(dto)) {
        const definition = await this.resolveDefinitionForUpdate(
          userId,
          id,
          dto.definitionId,
        );

        await this.prisma.vocabWordDefinition.update({
          where: { id: definition.id },
          data: this.buildDefinitionUpdateData(dto),
        });
      }
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Word already exists');
      }

      throw error;
    }

    return this.findActiveWordOrThrow(userId, id);
  }

  async updateReview(
    userId: string,
    id: string,
    dto: UpdateVocabReviewDto,
  ): Promise<Awaited<ReviewDefinitionResult>> {
    const definition = await this.findActiveDefinitionOrThrow(userId, id);

    return this.prisma.vocabWordDefinition.update({
      where: { id: definition.id },
      data: {
        level: dto.level,
        wrongCount: dto.wrongCount,
        lastReview: new Date(dto.lastReview),
        nextReview: dto.nextReview ? new Date(dto.nextReview) : null,
      },
      include: reviewDefinitionInclude,
    });
  }

  async softDeleteDefinition(
    userId: string,
    definitionId: string,
  ): Promise<DeleteVocabDefinitionResponse> {
    const definition = await this.findActiveDefinitionByIdOrThrow(
      userId,
      definitionId,
    );
    const vocabWordId = definition.vocabWordId;

    await this.prisma.vocabWordDefinition.update({
      where: { id: definition.id },
      data: {
        deletedAt: new Date(),
      },
    });

    try {
      const word = await this.findActiveWordOrThrow(userId, vocabWordId);

      return {
        deletedDefinitionId: definition.id,
        vocabWordId,
        wordRemoved: false,
        word,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          deletedDefinitionId: definition.id,
          vocabWordId,
          wordRemoved: true,
        };
      }

      throw error;
    }
  }

  async softDelete(
    userId: string,
    id: string,
  ): Promise<Awaited<UpdatedVocabWordResult>> {
    await this.findActiveWordOrThrow(userId, id);

    await this.prisma.vocabWordDefinition.updateMany({
      where: {
        vocabWordId: id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const word = await this.prisma.vocabWord.findUnique({
      where: { id },
      include: activeDefinitionsInclude,
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }

  private async findActiveWordOrThrow(
    userId: string,
    id: string,
  ): Promise<NonNullable<Awaited<VocabWordResult>>> {
    const word = await this.prisma.vocabWord.findFirst({
      where: {
        id,
        userId,
        definitions: {
          some: {
            deletedAt: null,
          },
        },
      },
      include: activeDefinitionsInclude,
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }

  private async findActiveDefinitionOrThrow(
    userId: string,
    id: string,
  ): Promise<ActiveReviewDefinitionResult> {
    const definition = await this.prisma.vocabWordDefinition.findFirst({
      where: {
        id,
        deletedAt: null,
        vocabWord: {
          userId,
        },
      },
      include: reviewDefinitionInclude,
    });

    if (definition) {
      return definition;
    }

    const legacyWordDefinition = await this.prisma.vocabWordDefinition.findFirst({
      where: {
        deletedAt: null,
        vocabWord: {
          id,
          userId,
        },
      },
      include: reviewDefinitionInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!legacyWordDefinition) {
      throw new NotFoundException('Word not found');
    }

    return legacyWordDefinition;
  }

  private async findActiveDefinitionByIdOrThrow(
    userId: string,
    definitionId: string,
  ): Promise<ActiveReviewDefinitionResult> {
    const definition = await this.prisma.vocabWordDefinition.findFirst({
      where: {
        id: definitionId,
        deletedAt: null,
        vocabWord: {
          userId,
        },
      },
      include: reviewDefinitionInclude,
    });

    if (!definition) {
      throw new NotFoundException('Definition not found');
    }

    return definition;
  }

  private async addManualDefinitionToExistingWord(
    existingWord: {
      id: string;
      definitions: Array<{ id: string }>;
    },
    dto: CreateVocabWordDto,
  ): Promise<Awaited<UpdatedVocabWordResult>> {
    const word = this.normalizeRequiredWord(dto.word);
    const data: {
      word?: string;
      definitions: {
        create: ReturnType<VocabService['buildManualDefinitionData']>;
      };
    } = {
      definitions: {
        create: this.buildManualDefinitionData(dto),
      },
    };

    if (existingWord.definitions.length === 0) {
      data.word = word;
    }

    return this.prisma.vocabWord.update({
      where: { id: existingWord.id },
      data,
      include: activeDefinitionsInclude,
    });
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

  private async resolveDefinitionForUpdate(
    userId: string,
    vocabWordId: string,
    definitionId?: string,
  ) {
    if (definitionId) {
      const definition = await this.prisma.vocabWordDefinition.findFirst({
        where: {
          id: definitionId,
          deletedAt: null,
          vocabWordId,
          vocabWord: {
            userId,
          },
        },
      });

      if (!definition) {
        throw new NotFoundException('Word not found');
      }

      return definition;
    }

    const word = await this.prisma.vocabWord.findFirst({
      where: {
        id: vocabWordId,
        userId,
      },
      include: activeDefinitionsInclude,
    });

    if (!word || word.definitions.length === 0) {
      throw new NotFoundException('Word not found');
    }

    const manualDefinition = word.definitions.find(
      (definition) => definition.source === 'manual',
    );

    return manualDefinition ?? word.definitions[0];
  }

  private buildDefinitionUpdateData(input: UpdateVocabWordDto) {
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
      ...(input.band !== undefined
        ? { band: normalizeOptionalText(input.band) }
        : {}),
      ...(input.ipaUk !== undefined
        ? { ipaUk: normalizeOptionalText(input.ipaUk) }
        : {}),
      ...(input.ipaUs !== undefined
        ? { ipaUs: normalizeOptionalText(input.ipaUs) }
        : {}),
      ...(input.exampleVi !== undefined
        ? { exampleVi: normalizeOptionalText(input.exampleVi) }
        : {}),
      ...(input.level !== undefined ? { level: input.level } : {}),
      ...(input.wrongCount !== undefined
        ? { wrongCount: input.wrongCount }
        : {}),
    };
  }

  private buildManualDefinitionData(
    input: CreateVocabWordDto | UpdateVocabWordDto,
  ) {
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

  private hasDefinitionInput(input: CreateVocabWordDto | UpdateVocabWordDto) {
    return (
      input.type !== undefined ||
      input.meaningVi !== undefined ||
      input.definition !== undefined ||
      input.example !== undefined ||
      input.exampleVi !== undefined ||
      input.ipaUk !== undefined ||
      input.ipaUs !== undefined ||
      input.band !== undefined ||
      input.level !== undefined ||
      input.wrongCount !== undefined
    );
  }

  private isOxfordDefinitionSource(source: string) {
    return OXFORD_DEFINITION_SOURCES.includes(
      source as (typeof OXFORD_DEFINITION_SOURCES)[number],
    );
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

function normalizeOptionalText(value?: string) {
  const trimmedValue = value?.trim();

  return trimmedValue || null;
}

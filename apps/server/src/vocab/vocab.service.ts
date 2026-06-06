import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVocabWordDto } from './dto/create-vocab-word.dto';
import { UpdateVocabWordDto } from './dto/update-vocab-word.dto';
import { normalizeWord } from './lib/normalize-word';

type VocabWordResult = ReturnType<PrismaService['vocabWord']['findFirst']>;
type VocabWordListResult = ReturnType<PrismaService['vocabWord']['findMany']>;
type CreatedVocabWordResult = ReturnType<PrismaService['vocabWord']['create']>;
type UpdatedVocabWordResult = ReturnType<PrismaService['vocabWord']['update']>;

@Injectable()
export class VocabService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): VocabWordListResult {
    return this.prisma.vocabWord.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(
    userId: string,
    dto: CreateVocabWordDto,
  ): Promise<Awaited<CreatedVocabWordResult>> {
    const word = this.normalizeRequiredWord(dto.word);
    const normalizedWord = normalizeWord(dto.word);

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
      ...(dto.word
        ? {
            word: this.normalizeRequiredWord(dto.word),
            normalizedWord: normalizeWord(dto.word),
          }
        : {}),
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

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}

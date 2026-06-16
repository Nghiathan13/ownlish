import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteAttemptPartDto } from './dto/complete-attempt-part.dto';
import { CreateAttemptDto } from './dto/create-attempt.dto';

const TOEIC_PART_COUNT = 7;
const DEFAULT_ATTEMPT_LIST_LIMIT = 20;

type AttemptWithParts = {
  id: string;
  userId: string;
  toeicTestId: number;
  startedAt: Date;
  completedAt: Date | null;
  totalCorrect: number;
  totalWrong: number;
  parts: Array<{
    id: string;
    partNumber: number;
    correctCount: number;
    wrongCount: number;
    completedAt: Date | null;
  }>;
  test: {
    id: number;
    year: number;
    testNumber: number;
  };
};

@Injectable()
export class AttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async createAttempt(userId: string, dto: CreateAttemptDto) {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: dto.testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const existingAttempt = await this.prisma.toeicTestAttempt.findFirst({
      where: {
        userId,
        toeicTestId: dto.testId,
        completedAt: null,
      },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
        },
        test: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (existingAttempt) {
      return this.formatAttemptResponse(existingAttempt);
    }

    const attempt = await this.prisma.toeicTestAttempt.create({
      data: {
        userId,
        toeicTestId: dto.testId,
        parts: {
          create: Array.from({ length: TOEIC_PART_COUNT }, (_, index) => ({
            partNumber: index + 1,
          })),
        },
      },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
        },
        test: true,
      },
    });

    return this.formatAttemptResponse(attempt);
  }

  async listAttempts(
    userId: string,
    testId?: number,
    limit = DEFAULT_ATTEMPT_LIST_LIMIT,
    offset = 0,
  ) {
    const where = {
      userId,
      ...(testId !== undefined ? { toeicTestId: testId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.toeicTestAttempt.findMany({
        where,
        include: {
          test: true,
          parts: {
            orderBy: { partNumber: 'asc' },
            select: {
              partNumber: true,
              completedAt: true,
            },
          },
        },
        orderBy: [{ startedAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.toeicTestAttempt.count({ where }),
    ]);

    return {
      items: items.map((attempt) => this.formatAttemptSummary(attempt)),
      total,
    };
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await this.findAttemptForUser(userId, attemptId);
    return this.formatAttemptResponse(attempt);
  }

  async completeAttemptPart(
    userId: string,
    attemptId: string,
    partNumber: number,
    dto: CompleteAttemptPartDto,
  ) {
    if (partNumber < 1 || partNumber > TOEIC_PART_COUNT) {
      throw new NotFoundException('Test part not found.');
    }

    const attempt = await this.findAttemptForUser(userId, attemptId);

    if (attempt.completedAt) {
      throw new ConflictException(
        'This full test attempt is already completed.',
      );
    }

    const attemptPart = attempt.parts.find(
      (part) => part.partNumber === partNumber,
    );

    if (!attemptPart) {
      throw new NotFoundException('Attempt part not found.');
    }

    const previousPart = attempt.parts.find(
      (part) => part.partNumber === partNumber - 1,
    );

    if (partNumber > 1 && !previousPart?.completedAt) {
      throw new ConflictException(
        'Complete the previous part before finishing this one.',
      );
    }

    const updatedAttempt = await this.prisma.$transaction(async (tx) => {
      await tx.toeicTestAttemptPart.update({
        where: { id: attemptPart.id },
        data: {
          correctCount: dto.correctCount,
          wrongCount: dto.wrongCount,
          completedAt: new Date(),
        },
      });

      const parts = await tx.toeicTestAttemptPart.findMany({
        where: { attemptId },
        orderBy: { partNumber: 'asc' },
      });

      const totalCorrect = parts.reduce(
        (sum, part) => sum + part.correctCount,
        0,
      );
      const totalWrong = parts.reduce((sum, part) => sum + part.wrongCount, 0);
      const allPartsCompleted = parts.every((part) => part.completedAt);

      return tx.toeicTestAttempt.update({
        where: { id: attemptId },
        data: {
          totalCorrect,
          totalWrong,
          completedAt: allPartsCompleted ? new Date() : null,
        },
        include: {
          parts: {
            orderBy: { partNumber: 'asc' },
          },
          test: true,
        },
      });
    });

    return this.formatAttemptResponse(updatedAttempt);
  }

  async completeAttempt(userId: string, attemptId: string) {
    const attempt = await this.findAttemptForUser(userId, attemptId);

    if (attempt.completedAt) {
      return this.formatAttemptResponse(attempt);
    }

    const incompletePart = attempt.parts.find((part) => !part.completedAt);

    if (incompletePart) {
      throw new ConflictException(
        `Part ${incompletePart.partNumber} is not completed yet.`,
      );
    }

    const updatedAttempt = await this.prisma.toeicTestAttempt.update({
      where: { id: attemptId },
      data: { completedAt: new Date() },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
        },
        test: true,
      },
    });

    return this.formatAttemptResponse(updatedAttempt);
  }

  private async findAttemptForUser(
    userId: string,
    attemptId: string,
  ): Promise<AttemptWithParts> {
    const attempt = await this.prisma.toeicTestAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
        },
        test: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Test attempt not found.');
    }

    return attempt;
  }

  private getCurrentPartNumber(
    parts: Array<{
      partNumber: number;
      completedAt: Date | null;
    }>,
  ) {
    const nextPart = parts.find((part) => !part.completedAt);
    return nextPart?.partNumber ?? TOEIC_PART_COUNT + 1;
  }

  private formatAttemptSummary(attempt: {
    id: string;
    toeicTestId: number;
    startedAt: Date;
    completedAt: Date | null;
    totalCorrect: number;
    totalWrong: number;
    test: {
      year: number;
      testNumber: number;
    };
    parts?: Array<{
      partNumber: number;
      completedAt: Date | null;
    }>;
  }) {
    return {
      attemptId: attempt.id,
      testId: attempt.toeicTestId,
      testLabel: `Test ${attempt.test.testNumber}`,
      year: attempt.test.year,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
      totalCorrect: attempt.totalCorrect,
      totalWrong: attempt.totalWrong,
      currentPartNumber: attempt.parts
        ? this.getCurrentPartNumber(attempt.parts)
        : TOEIC_PART_COUNT + 1,
    };
  }

  private formatAttemptResponse(attempt: AttemptWithParts) {
    return {
      attemptId: attempt.id,
      testId: attempt.toeicTestId,
      testLabel: `Test ${attempt.test.testNumber}`,
      year: attempt.test.year,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
      totalCorrect: attempt.totalCorrect,
      totalWrong: attempt.totalWrong,
      currentPartNumber: this.getCurrentPartNumber(attempt.parts),
      parts: attempt.parts.map((part) => ({
        partNumber: part.partNumber,
        correctCount: part.correctCount,
        wrongCount: part.wrongCount,
        completedAt: part.completedAt?.toISOString() ?? null,
      })),
    };
  }
}

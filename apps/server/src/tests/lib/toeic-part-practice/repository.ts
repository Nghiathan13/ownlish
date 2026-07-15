import { Injectable } from '@nestjs/common';
import { Prisma, ToeicRunQuestionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { PartPracticeRunForResponse } from './session.types';

@Injectable()
export class ToeicPartPracticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async lockRunForUpdate(
    tx: Prisma.TransactionClient,
    runId: string,
  ): Promise<{ id: string } | null> {
    const [run] = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT "id"
        FROM "toeic_part_practice_runs"
        WHERE "id" = ${runId}
        FOR UPDATE
      `,
    );

    return run ?? null;
  }

  findRunByUserAndPart(
    userId: string,
    partNumber: number,
  ): Promise<PartPracticeRunForResponse | null> {
    return this.prisma.toeicPartPracticeRun.findUnique({
      where: {
        userId_partNumber: {
          userId,
          partNumber,
        },
      },
    });
  }

  findOwnedRunMeta(userId: string, sessionId: string) {
    return this.prisma.toeicPartPracticeRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        partNumber: true,
        totalRight: true,
        totalWrong: true,
      },
    });
  }

  findOwnedRun(userId: string, sessionId: string) {
    return this.prisma.toeicPartPracticeRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        partNumber: true,
      },
    });
  }

  async listCatalogPartNumbers(): Promise<number[]> {
    const parts = await this.prisma.toeicTestPart.findMany({
      select: { partNumber: true },
      distinct: ['partNumber'],
      orderBy: { partNumber: 'asc' },
    });

    return parts.map((part) => part.partNumber);
  }

  countCatalogQuestionsByPart(partNumber: number): Promise<number> {
    return this.prisma.toeicQuestion.count({
      where: {
        group: {
          testPart: {
            partNumber,
          },
        },
      },
    });
  }

  countAnswersByStatus(
    runId: string,
    status: ToeicRunQuestionStatus,
  ): Promise<number> {
    return this.prisma.toeicPartPracticeAnswer.count({
      where: { runId, status },
    });
  }

  listFullQuestionGroupsForPart(partNumber: number) {
    return this.prisma.toeicQuestionGroup.findMany({
      where: {
        testPart: {
          partNumber,
        },
      },
      include: {
        testPart: {
          select: {
            partNumber: true,
            testId: true,
            test: {
              select: {
                year: true,
                testNumber: true,
              },
            },
          },
        },
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
      orderBy: [
        { testPart: { test: { year: 'asc' } } },
        { testPart: { test: { testNumber: 'asc' } } },
        { questionStart: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  listAnswersForRun(runId: string) {
    return this.prisma.toeicPartPracticeAnswer.findMany({
      where: { runId },
    });
  }

  listAnswersForQuestions(runId: string, toeicQuestionIds: number[]) {
    return this.prisma.toeicPartPracticeAnswer.findMany({
      where: {
        runId,
        toeicQuestionId: { in: toeicQuestionIds },
      },
    });
  }

  listQuestionIdsByGroup(groupId: number): Promise<number[]> {
    return this.prisma.toeicQuestion
      .findMany({
        where: { groupId },
        select: { id: true },
        orderBy: { questionNumber: 'asc' },
      })
      .then((questions) => questions.map((q) => q.id));
  }

  findQuestionWithTestPart(toeicQuestionId: number) {
    return this.prisma.toeicQuestion.findUnique({
      where: { id: toeicQuestionId },
      include: {
        group: {
          include: {
            testPart: true,
          },
        },
      },
    });
  }

  async resetPartPracticeAnswers(
    userId: string,
    partNumber: number,
  ): Promise<number> {
    return this.transaction(async (tx) => {
      const run = await tx.toeicPartPracticeRun.findUnique({
        where: {
          userId_partNumber: {
            userId,
            partNumber,
          },
        },
        select: { id: true },
      });

      if (!run) {
        return 0;
      }

      await this.lockRunForUpdate(tx, run.id);
      await tx.toeicPartPracticeAnswer.deleteMany({
        where: { runId: run.id },
      });

      await tx.toeicPartPracticeRun.update({
        where: { id: run.id },
        data: {
          totalRight: 0,
          totalWrong: 0,
        },
      });
      return 1;
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma, ToeicRunQuestionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ToeicQuestionGroupForPartPractice } from './materializer.types';
import { partPracticeRunResponseInclude } from './response.include';
import type { PartPracticeRunForResponse } from './session.types';

@Injectable()
export class ToeicPartPracticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  findRunForResponse(
    runId: string,
  ): Promise<PartPracticeRunForResponse | null> {
    return this.prisma.toeicPartPracticeRun.findUnique({
      where: { id: runId },
      include: partPracticeRunResponseInclude(),
    });
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
      include: partPracticeRunResponseInclude(),
    });
  }

  findOwnedRunMeta(userId: string, sessionId: string) {
    return this.prisma.toeicPartPracticeRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        partNumber: true,
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

  async countRunQuestionsByStatus(
    runId: string,
    status: ToeicRunQuestionStatus,
  ): Promise<number> {
    return this.prisma.toeicPartPracticeQuestion.count({
      where: { runId, status },
    });
  }

  listQuestionGroupsForPart(
    db: Pick<PrismaService, 'toeicQuestionGroup'> | Prisma.TransactionClient,
    partNumber: number,
  ): Promise<ToeicQuestionGroupForPartPractice[]> {
    return db.toeicQuestionGroup.findMany({
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
          select: {
            id: true,
            questionNumber: true,
          },
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

  listQuestionGroupsForPartCatalog(
    partNumber: number,
  ): Promise<ToeicQuestionGroupForPartPractice[]> {
    return this.listQuestionGroupsForPart(this.prisma, partNumber);
  }

  countRunQuestions(runId: string): Promise<number> {
    return this.prisma.toeicPartPracticeQuestion.count({
      where: { runId },
    });
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

  findRunQuestionWithQuestion(runId: string, toeicQuestionId: number) {
    return this.prisma.toeicPartPracticeQuestion.findUnique({
      where: {
        runId_toeicQuestionId: {
          runId,
          toeicQuestionId,
        },
      },
      include: { toeicQuestion: true },
    });
  }

  async resetPartPracticeAnswers(
    userId: string,
    partNumber: number,
  ): Promise<number> {
    const run = await this.prisma.toeicPartPracticeRun.findUnique({
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

    await this.transaction(async (tx) => {
      await tx.toeicPartPracticeQuestion.updateMany({
        where: { runId: run.id },
        data: {
          selectedKey: null,
          status: null,
          answeredAt: null,
          gradedAt: null,
        },
      });

      await tx.toeicPartPracticeGroup.updateMany({
        where: { runId: run.id },
        data: { status: null },
      });

      await tx.toeicPartPracticeRun.update({
        where: { id: run.id },
        data: {
          totalRight: 0,
          totalWrong: 0,
        },
      });
    });

    return 1;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ToeicRunMode, ToeicRunQuestionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ToeicRunForResponse } from './session.types';
import { toeicRunResponseInclude } from './response.include';
import type { ToeicQuestionGroupForRun } from './materializer.types';
import type {
  ToeicOwnedRunMeta,
  ToeicOwnedRunRecord,
  ToeicTestYear,
} from './repository.types';

@Injectable()
export class ToeicRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  findRunForResponse(runId: string): Promise<ToeicRunForResponse | null> {
    return this.prisma.toeicRun.findUnique({
      where: { id: runId },
      include: toeicRunResponseInclude(),
    });
  }

  findLatestPracticeRun(
    userId: string,
    testId: number,
  ): Promise<ToeicRunForResponse | null> {
    return this.prisma.toeicRun.findFirst({
      where: {
        userId,
        toeicTestId: testId,
        mode: ToeicRunMode.PRACTICE,
      },
      orderBy: { createdAt: 'desc' },
      include: toeicRunResponseInclude(),
    });
  }

  findOwnedRunMeta(
    userId: string,
    sessionId: string,
  ): Promise<ToeicOwnedRunMeta | null> {
    return this.prisma.toeicRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        toeicTestId: true,
        selectedParts: true,
      },
    });
  }

  findOwnedRun(
    userId: string,
    sessionId: string,
  ): Promise<ToeicOwnedRunRecord | null> {
    return this.prisma.toeicRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        toeicTestId: true,
        selectedParts: true,
        completedAt: true,
      },
    });
  }

  async getTestYear(testId: number): Promise<number> {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: testId },
      select: { year: true },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    return test.year;
  }

  async findTestById(testId: number): Promise<ToeicTestYear | null> {
    return this.prisma.toeicTest.findUnique({
      where: { id: testId },
      select: { id: true, year: true },
    });
  }

  async assertTestAndPartsExist(
    testId: number,
    selectedParts: number[],
  ): Promise<void> {
    const test = await this.findTestById(testId);

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const parts = await this.prisma.toeicTestPart.findMany({
      where: {
        testId,
        partNumber: { in: selectedParts },
      },
      select: { partNumber: true },
    });
    const foundParts = new Set(parts.map((part) => part.partNumber));
    const missingPart = selectedParts.find((part) => !foundParts.has(part));

    if (missingPart !== undefined) {
      throw new NotFoundException('Test part not found.');
    }
  }

  async deletePracticeRunsForUserAndTest(
    userId: string,
    testId: number,
  ): Promise<number> {
    const result = await this.prisma.toeicRun.deleteMany({
      where: {
        userId,
        toeicTestId: testId,
        mode: ToeicRunMode.PRACTICE,
      },
    });

    return result.count;
  }

  listQuestionGroupsForParts(
    db: Pick<PrismaService, 'toeicQuestionGroup'> | Prisma.TransactionClient,
    testId: number,
    selectedParts: number[],
  ): Promise<ToeicQuestionGroupForRun[]> {
    return db.toeicQuestionGroup.findMany({
      where: {
        testPart: {
          testId,
          partNumber: { in: selectedParts },
        },
      },
      include: {
        testPart: {
          select: { partNumber: true },
        },
        questions: {
          orderBy: { questionNumber: 'asc' },
          select: {
            id: true,
            questionNumber: true,
          },
        },
      },
      orderBy: [{ questionStart: 'asc' }, { id: 'asc' }],
    });
  }

  listQuestionGroupsForPartsForTest(
    testId: number,
    selectedParts: number[],
  ): Promise<ToeicQuestionGroupForRun[]> {
    return this.listQuestionGroupsForParts(
      this.prisma,
      testId,
      selectedParts,
    );
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
    return this.prisma.toeicRunQuestion.findUnique({
      where: {
        runId_toeicQuestionId: {
          runId,
          toeicQuestionId,
        },
      },
      include: { toeicQuestion: true },
    });
  }

  updateRunQuestionSelection(runQuestionId: string, selectedKey: string) {
    return this.prisma.toeicRunQuestion.update({
      where: { id: runQuestionId },
      data: {
        selectedKey,
        status: ToeicRunQuestionStatus.SELECTED,
        answeredAt: new Date(),
      },
    });
  }
}

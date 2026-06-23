import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ToeicRunMode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ToeicRunForResponse } from './toeic-run-session.types';
import { toeicRunResponseInclude } from './toeic-run-response.include';
import type {
  CreateToeicRunWithQuestionsInput,
  ToeicQuestionGroupForRun,
} from './toeic-run-materializer.types';

@Injectable()
export class ToeicRunMaterializer {
  constructor(private readonly prisma: PrismaService) {}

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

  findRunForResponse(runId: string): Promise<ToeicRunForResponse | null> {
    return this.prisma.toeicRun.findUnique({
      where: { id: runId },
      include: toeicRunResponseInclude(),
    });
  }

  async ensurePracticeRunIncludesParts(
    runId: string,
    testId: number,
    selectedParts: number[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const run = await tx.toeicRun.findUnique({
        where: { id: runId },
        include: {
          groups: {
            select: {
              toeicQuestionGroupId: true,
              partNumber: true,
              sortOrder: true,
            },
          },
        },
      });

      if (!run) {
        return;
      }

      const nextSelectedParts = [
        ...new Set([...run.selectedParts, ...selectedParts]),
      ].sort((a, b) => a - b);
      const existingGroupIds = new Set(
        run.groups.map((group) => group.toeicQuestionGroupId),
      );
      const nextGroupSortOrder =
        run.groups.reduce(
          (highest, group) => Math.max(highest, group.sortOrder),
          -1,
        ) + 1;
      const groups = await this.listQuestionGroupsForParts(
        tx,
        testId,
        selectedParts,
      );
      const newGroups = groups.filter((group) => !existingGroupIds.has(group.id));

      await this.attachQuestionGroupsToRun(
        tx,
        runId,
        newGroups,
        nextGroupSortOrder,
      );

      if (nextSelectedParts.join(',') !== run.selectedParts.join(',')) {
        await tx.toeicRun.update({
          where: { id: runId },
          data: { selectedParts: nextSelectedParts },
        });
      }
    });
  }

  async createRunWithQuestions(
    input: CreateToeicRunWithQuestionsInput,
  ): Promise<ToeicRunForResponse> {
    const groups = await this.listQuestionGroupsForParts(
      this.prisma,
      input.testId,
      input.selectedParts,
    );

    const run = await this.prisma.$transaction(async (tx) => {
      const createdRun = await tx.toeicRun.create({
        data: {
          userId: input.userId,
          toeicTestId: input.testId,
          mode: input.mode,
          selectedParts: input.selectedParts,
        },
      });

      await this.attachQuestionGroupsToRun(tx, createdRun.id, groups, 0);

      return createdRun;
    });

    const created = await this.findRunForResponse(run.id);
    if (!created) {
      throw new NotFoundException('Practice session not found.');
    }

    return created;
  }

  private listQuestionGroupsForParts(
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

  private async attachQuestionGroupsToRun(
    tx: Prisma.TransactionClient,
    runId: string,
    groups: ToeicQuestionGroupForRun[],
    startSortOrder: number,
  ): Promise<void> {
    let nextSortOrder = startSortOrder;

    for (const group of groups) {
      const runGroup = await tx.toeicRunGroup.create({
        data: {
          runId,
          toeicQuestionGroupId: group.id,
          partNumber: group.testPart.partNumber,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          sortOrder: nextSortOrder,
        },
      });
      nextSortOrder += 1;

      await tx.toeicRunQuestion.createMany({
        data: group.questions.map((question) => ({
          runId,
          runGroupId: runGroup.id,
          toeicQuestionId: question.id,
          partNumber: group.testPart.partNumber,
          questionNumber: question.questionNumber,
          sortOrder: question.questionNumber,
        })),
      });
    }
  }
}

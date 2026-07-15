import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ToeicQuestionGroupForPartPractice } from './materializer.types';
import { ToeicPartPracticeRepository } from './repository';
import type { PartPracticeRunForResponse } from './session.types';

@Injectable()
export class ToeicPartPracticeMaterializer {
  constructor(
    private readonly partPracticeRepository: ToeicPartPracticeRepository,
  ) {}

  findRunByUserAndPart(
    userId: string,
    partNumber: number,
  ): Promise<PartPracticeRunForResponse | null> {
    return this.partPracticeRepository.findRunByUserAndPart(userId, partNumber);
  }

  findRunForResponse(
    runId: string,
  ): Promise<PartPracticeRunForResponse | null> {
    return this.partPracticeRepository.findRunForResponse(runId);
  }

  async findOrCreateRunWithQuestions(
    userId: string,
    partNumber: number,
  ): Promise<PartPracticeRunForResponse> {
    const existingRun = await this.findRunByUserAndPart(userId, partNumber);
    if (existingRun) {
      return existingRun;
    }

    const catalogGroups =
      await this.partPracticeRepository.listQuestionGroupsForPartCatalog(
        partNumber,
      );

    const run = await this.partPracticeRepository.transaction(async (tx) => {
      const createdRun = await tx.toeicPartPracticeRun.create({
        data: {
          userId,
          partNumber,
        },
      });

      await this.attachQuestionGroupsToRun(
        tx,
        createdRun.id,
        partNumber,
        catalogGroups,
        0,
        1,
      );

      return createdRun;
    });

    const created = await this.findRunForResponse(run.id);
    if (!created) {
      throw new NotFoundException('Part practice session not found.');
    }

    return created;
  }

  private async attachQuestionGroupsToRun(
    tx: Prisma.TransactionClient,
    runId: string,
    partNumber: number,
    groups: ToeicQuestionGroupForPartPractice[],
    startGroupSortOrder: number,
    startQuestionSortOrder: number,
  ): Promise<void> {
    let nextGroupSortOrder = startGroupSortOrder;
    let nextQuestionSortOrder = startQuestionSortOrder;

    for (const group of groups) {
      const runGroup = await tx.toeicPartPracticeGroup.create({
        data: {
          runId,
          toeicQuestionGroupId: group.id,
          toeicTestId: group.testPart.testId,
          partNumber,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          sortOrder: nextGroupSortOrder,
        },
      });
      nextGroupSortOrder += 1;

      await tx.toeicPartPracticeQuestion.createMany({
        data: group.questions.map((question) => {
          const row = {
            runId,
            runGroupId: runGroup.id,
            toeicQuestionId: question.id,
            toeicTestId: group.testPart.testId,
            partNumber,
            questionNumber: question.questionNumber,
            sortOrder: nextQuestionSortOrder,
          };
          nextQuestionSortOrder += 1;
          return row;
        }),
      });
    }
  }
}

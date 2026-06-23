import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';
import { SubmitToeicAnswerDto } from '../../dto/submit-toeic-answer.dto';
import {
  getOptionText,
  getOptionViText,
  isToeicQuestionOptionKey,
  parseAnswerKey,
  type ToeicQuestionOptionKey,
} from '../toeic-question-mapper';
import { isToeicRunGroupReadyToGrade } from './grader.helpers';
import type {
  SubmitToeicAnswerResponse,
  ToeicQuestionWithTestPart,
  ToeicRunQuestionWithQuestion,
} from './grader.types';
import { ToeicRunRepository } from './repository';

@Injectable()
export class ToeicRunGrader {
  constructor(private readonly runRepository: ToeicRunRepository) {}

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitToeicAnswerDto,
  ): Promise<SubmitToeicAnswerResponse> {
    const run = await this.runRepository.findOwnedRun(userId, sessionId);

    if (!run) {
      throw new NotFoundException('Practice session not found.');
    }

    if (run.completedAt) {
      throw new BadRequestException('TOEIC run is already completed.');
    }

    const question = await this.runRepository.findQuestionWithTestPart(
      dto.toeicQuestionId,
    );

    if (!question || question.group.testPart.testId !== run.toeicTestId) {
      throw new BadRequestException(
        'Question does not belong to this session.',
      );
    }

    const answerKey = parseAnswerKey(question.answerKey);
    const selectedKey = dto.selectedKey.trim().toUpperCase();

    if (!answerKey) {
      throw new BadRequestException('Question has an invalid answer key.');
    }

    if (!isToeicQuestionOptionKey(selectedKey)) {
      throw new BadRequestException('Invalid answer.');
    }

    const runQuestion = await this.runRepository.findRunQuestionWithQuestion(
      run.id,
      question.id,
    );

    if (!runQuestion) {
      throw new BadRequestException(
        'Question does not belong to this session.',
      );
    }

    if (run.mode === ToeicRunMode.MOCK_TEST) {
      return this.submitMockAnswer(runQuestion, selectedKey);
    }

    if (runQuestion.status === ToeicRunQuestionStatus.RIGHT) {
      return this.buildGradedResponse(question, answerKey, true);
    }

    return this.submitGroupAnswer(
      run.id,
      runQuestion,
      question,
      selectedKey,
      answerKey,
      dto.mode === 'review_wrong',
    );
  }

  async completeMockRun(runId: string): Promise<void> {
    await this.runRepository.transaction(async (tx) => {
      const questions = await tx.toeicRunQuestion.findMany({
        where: { runId },
        include: { toeicQuestion: true },
      });
      const now = new Date();
      const runGroupIds = new Set<string>();

      for (const question of questions) {
        runGroupIds.add(question.runGroupId);

        const answerKey = parseAnswerKey(question.toeicQuestion.answerKey);
        if (!answerKey) {
          continue;
        }

        const selectedKey = question.selectedKey?.trim().toUpperCase();
        const hasValidSelection =
          selectedKey != null && isToeicQuestionOptionKey(selectedKey);

        if (hasValidSelection) {
          await tx.toeicRunQuestion.update({
            where: { id: question.id },
            data: {
              selectedKey,
              status:
                selectedKey === answerKey
                  ? ToeicRunQuestionStatus.RIGHT
                  : ToeicRunQuestionStatus.WRONG,
              answeredAt: question.answeredAt ?? now,
              gradedAt: now,
            },
          });
          continue;
        }

        await tx.toeicRunQuestion.update({
          where: { id: question.id },
          data: {
            status: ToeicRunQuestionStatus.WRONG,
            gradedAt: now,
          },
        });
      }

      for (const runGroupId of runGroupIds) {
        await this.refreshRunGroupStatus(tx, runGroupId);
      }

      await this.recalculateRunTotals(tx, runId);
      await tx.toeicRun.update({
        where: { id: runId },
        data: { completedAt: now },
      });
    });
  }

  private buildGradedResponse(
    question: ToeicQuestion,
    answerKey: ToeicQuestionOptionKey,
    isCorrect: boolean,
  ): SubmitToeicAnswerResponse {
    return {
      graded: true,
      isCorrect,
      answerKey,
      correctOptionEn: getOptionText(question, answerKey),
      correctOptionVi: getOptionViText(question, answerKey),
    };
  }

  private async submitMockAnswer(
    runQuestion: ToeicRunQuestionWithQuestion,
    selectedKey: ToeicQuestionOptionKey,
  ): Promise<SubmitToeicAnswerResponse> {
    await this.runRepository.updateRunQuestionSelection(
      runQuestion.id,
      selectedKey,
    );

    return { graded: false };
  }

  private async submitGroupAnswer(
    runId: string,
    runQuestion: ToeicRunQuestionWithQuestion,
    question: ToeicQuestionWithTestPart,
    selectedKey: ToeicQuestionOptionKey,
    answerKey: ToeicQuestionOptionKey,
    isReviewWrongSubmission: boolean,
  ): Promise<SubmitToeicAnswerResponse> {
    let graded = false;

    await this.runRepository.transaction(async (tx) => {
      await tx.toeicRunQuestion.update({
        where: { id: runQuestion.id },
        data: {
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
        },
      });

      const groupQuestions = await tx.toeicRunQuestion.findMany({
        where: { runGroupId: runQuestion.runGroupId },
        select: { selectedKey: true, status: true },
      });

      if (
        isToeicRunGroupReadyToGrade(groupQuestions, isReviewWrongSubmission)
      ) {
        await this.gradeRunGroup(tx, runId, runQuestion.runGroupId);
        graded = true;
      }
    });

    if (!graded) {
      return { graded: false };
    }

    return this.buildGradedResponse(
      question,
      answerKey,
      selectedKey === answerKey,
    );
  }

  private async gradeRunGroup(
    tx: Prisma.TransactionClient,
    runId: string,
    runGroupId: string,
  ): Promise<void> {
    const questions = await tx.toeicRunQuestion.findMany({
      where: { runGroupId },
      include: { toeicQuestion: true },
    });

    for (const question of questions) {
      if (question.status === ToeicRunQuestionStatus.RIGHT) {
        continue;
      }

      const answerKey = parseAnswerKey(question.toeicQuestion.answerKey);
      const selectedKey = question.selectedKey?.trim().toUpperCase();

      if (
        !answerKey ||
        !selectedKey ||
        !isToeicQuestionOptionKey(selectedKey)
      ) {
        continue;
      }

      const isCorrect = selectedKey === answerKey;
      await this.gradeRunQuestion(tx, {
        runId,
        runQuestion: question,
        selectedKey,
        isCorrect,
      });
    }
  }

  private async gradeRunQuestion(
    tx: Prisma.TransactionClient,
    input: {
      runId: string;
      runQuestion: {
        id: string;
        runId: string;
        runGroupId: string;
        status: ToeicRunQuestionStatus | null;
      };
      selectedKey: string;
      isCorrect: boolean;
    },
  ): Promise<void> {
    if (input.runQuestion.status === ToeicRunQuestionStatus.RIGHT) {
      return;
    }

    await tx.toeicRunQuestion.update({
      where: { id: input.runQuestion.id },
      data: {
        selectedKey: input.selectedKey,
        status: input.isCorrect
          ? ToeicRunQuestionStatus.RIGHT
          : ToeicRunQuestionStatus.WRONG,
        answeredAt: new Date(),
        gradedAt: new Date(),
      },
    });

    await this.refreshRunGroupStatus(tx, input.runQuestion.runGroupId);
    await this.recalculateRunTotals(tx, input.runId);
  }

  private async refreshRunGroupStatus(
    tx: Prisma.TransactionClient,
    runGroupId: string,
  ): Promise<void> {
    const questions = await tx.toeicRunQuestion.findMany({
      where: { runGroupId },
      select: { status: true },
    });

    const status = questions.some(
      (question) => question.status === ToeicRunQuestionStatus.WRONG,
    )
      ? ToeicRunGroupStatus.WRONG
      : questions.length > 0 &&
          questions.every(
            (question) => question.status === ToeicRunQuestionStatus.RIGHT,
          )
        ? ToeicRunGroupStatus.RIGHT
        : null;

    await tx.toeicRunGroup.update({
      where: { id: runGroupId },
      data: { status },
    });
  }

  private async recalculateRunTotals(
    tx: Prisma.TransactionClient,
    runId: string,
  ): Promise<void> {
    const [totalRight, totalWrong] = await Promise.all([
      tx.toeicRunQuestion.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicRunQuestion.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);

    await tx.toeicRun.update({
      where: { id: runId },
      data: { totalRight, totalWrong },
    });
  }
}

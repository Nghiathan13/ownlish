import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ToeicRunGroupStatus,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';
import { SubmitPartPracticeAnswerDto } from '../../dto/submit-part-practice-answer.dto';
import {
  getOptionText,
  getOptionViText,
  isToeicQuestionOptionKey,
  parseAnswerKey,
  type ToeicQuestionOptionKey,
} from '../toeic-question-mapper';
import { isToeicRunGroupReadyToGrade } from '../toeic-run/grader.helpers';
import type {
  PartPracticeQuestionWithTestPart,
  PartPracticeRunQuestionWithQuestion,
  SubmitPartPracticeAnswerResponse,
} from './grader.types';
import { ToeicPartPracticeRepository } from './repository';

@Injectable()
export class ToeicPartPracticeGrader {
  constructor(
    private readonly partPracticeRepository: ToeicPartPracticeRepository,
  ) {}

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitPartPracticeAnswerDto,
  ): Promise<SubmitPartPracticeAnswerResponse> {
    const run = await this.partPracticeRepository.findOwnedRun(
      userId,
      sessionId,
    );

    if (!run) {
      throw new NotFoundException('Part practice session not found.');
    }

    const question = await this.partPracticeRepository.findQuestionWithTestPart(
      dto.toeicQuestionId,
    );

    if (!question || question.group.testPart.partNumber !== run.partNumber) {
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

    const runQuestion =
      await this.partPracticeRepository.findRunQuestionWithQuestion(
        run.id,
        question.id,
      );

    if (!runQuestion) {
      throw new BadRequestException(
        'Question does not belong to this session.',
      );
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

  private buildGradedResponse(
    question: ToeicQuestion,
    answerKey: ToeicQuestionOptionKey,
    isCorrect: boolean,
  ): SubmitPartPracticeAnswerResponse {
    return {
      graded: true,
      isCorrect,
      answerKey,
      correctOptionEn: getOptionText(question, answerKey),
      correctOptionVi: getOptionViText(question, answerKey),
    };
  }

  private async submitGroupAnswer(
    runId: string,
    runQuestion: PartPracticeRunQuestionWithQuestion,
    question: PartPracticeQuestionWithTestPart,
    selectedKey: ToeicQuestionOptionKey,
    answerKey: ToeicQuestionOptionKey,
    isReviewWrongSubmission: boolean,
  ): Promise<SubmitPartPracticeAnswerResponse> {
    let graded = false;
    let idempotentResult: boolean | undefined;

    await this.partPracticeRepository.transaction(async (tx) => {
      const run = await this.partPracticeRepository.lockRunForUpdate(tx, runId);

      if (!run) {
        throw new NotFoundException('Part practice session not found.');
      }

      const currentRunQuestion = await tx.toeicPartPracticeQuestion.findUnique({
        where: {
          runId_toeicQuestionId: {
            runId,
            toeicQuestionId: runQuestion.toeicQuestionId,
          },
        },
      });

      if (!currentRunQuestion) {
        throw new BadRequestException(
          'Question does not belong to this session.',
        );
      }

      const isGraded =
        currentRunQuestion.status === ToeicRunQuestionStatus.RIGHT ||
        currentRunQuestion.status === ToeicRunQuestionStatus.WRONG;
      const canRetryWrong =
        isReviewWrongSubmission &&
        currentRunQuestion.status === ToeicRunQuestionStatus.WRONG;

      if (isGraded && !canRetryWrong) {
        const currentSelectedKey = currentRunQuestion.selectedKey
          ?.trim()
          .toUpperCase();

        if (currentSelectedKey === selectedKey) {
          idempotentResult =
            currentRunQuestion.status === ToeicRunQuestionStatus.RIGHT;
          return;
        }

        throw new BadRequestException('Graded answers cannot be changed.');
      }

      await tx.toeicPartPracticeQuestion.update({
        where: { id: currentRunQuestion.id },
        data: {
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
        },
      });

      const groupQuestions = await tx.toeicPartPracticeQuestion.findMany({
        where: { runGroupId: currentRunQuestion.runGroupId },
        select: { selectedKey: true, status: true },
      });

      if (
        isToeicRunGroupReadyToGrade(groupQuestions, isReviewWrongSubmission)
      ) {
        await this.gradeRunGroup(tx, runId, currentRunQuestion.runGroupId);
        graded = true;
      }
    });

    if (idempotentResult !== undefined) {
      return this.buildGradedResponse(question, answerKey, idempotentResult);
    }

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
    const questions = await tx.toeicPartPracticeQuestion.findMany({
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

    await tx.toeicPartPracticeQuestion.update({
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
    const questions = await tx.toeicPartPracticeQuestion.findMany({
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

    await tx.toeicPartPracticeGroup.update({
      where: { id: runGroupId },
      data: { status },
    });
  }

  private async recalculateRunTotals(
    tx: Prisma.TransactionClient,
    runId: string,
  ): Promise<void> {
    const [totalRight, totalWrong] = await Promise.all([
      tx.toeicPartPracticeQuestion.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicPartPracticeQuestion.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);

    await tx.toeicPartPracticeRun.update({
      where: { id: runId },
      data: { totalRight, totalWrong },
    });
  }
}

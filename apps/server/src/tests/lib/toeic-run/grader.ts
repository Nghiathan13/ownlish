import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
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
  ToeicRunQuestionGradeState,
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

    if (
      !question ||
      question.group.testPart.testId !== run.toeicTestId ||
      !run.selectedParts.includes(question.group.testPart.partNumber)
    ) {
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

    if (run.mode === ToeicRunMode.MOCK_TEST) {
      return this.submitMockAnswer(run.id, question.id, selectedKey);
    }

    return this.submitGroupAnswer(
      run.id,
      question,
      selectedKey,
      answerKey,
      dto.mode === 'review_wrong',
    );
  }

  async completeMockRun(runId: string): Promise<void> {
    await this.runRepository.transaction(async (tx) => {
      const run = await this.runRepository.lockRunForUpdate(tx, runId);

      if (!run) {
        throw new NotFoundException('TOEIC run not found.');
      }

      if (run.completedAt) {
        return;
      }

      const persistedRun = await tx.toeicRun.findUnique({
        where: { id: runId },
        select: { toeicTestId: true, selectedParts: true },
      });
      if (!persistedRun) {
        throw new NotFoundException('TOEIC run not found.');
      }

      const [questions, answers] = await Promise.all([
        tx.toeicQuestion.findMany({
          where: {
            group: {
              testPart: {
                testId: persistedRun.toeicTestId,
                partNumber: { in: persistedRun.selectedParts },
              },
            },
          },
          select: { id: true, answerKey: true },
        }),
        tx.toeicRunAnswer.findMany({ where: { runId } }),
      ]);
      const now = new Date();
      const answerByQuestionId = new Map(
        answers.map((answer) => [answer.toeicQuestionId, answer]),
      );
      let totalRight = 0;

      for (const question of questions) {
        const answer = answerByQuestionId.get(question.id);
        const answerKey = parseAnswerKey(question.answerKey);
        const selectedKey = answer?.selectedKey.trim().toUpperCase();
        const isCorrect =
          answerKey != null &&
          selectedKey != null &&
          isToeicQuestionOptionKey(selectedKey) &&
          selectedKey === answerKey;

        if (isCorrect) {
          totalRight += 1;
        }

        if (answer) {
          await tx.toeicRunAnswer.update({
            where: { id: answer.id },
            data: {
              selectedKey,
              status: isCorrect
                ? ToeicRunQuestionStatus.RIGHT
                : ToeicRunQuestionStatus.WRONG,
              gradedAt: now,
            },
          });
        }
      }

      await tx.toeicRun.update({
        where: { id: runId },
        data: {
          totalRight,
          totalWrong: questions.length - totalRight,
          completedAt: now,
        },
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
    runId: string,
    toeicQuestionId: number,
    selectedKey: ToeicQuestionOptionKey,
  ): Promise<SubmitToeicAnswerResponse> {
    await this.runRepository.transaction(async (tx) => {
      const run = await this.lockOpenRun(tx, runId);
      const existingAnswer = await tx.toeicRunAnswer.findUnique({
        where: { runId_toeicQuestionId: { runId, toeicQuestionId } },
      });
      const now = new Date();

      if (existingAnswer) {
        await tx.toeicRunAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedKey,
            status: ToeicRunQuestionStatus.SELECTED,
            answeredAt: now,
            gradedAt: null,
          },
        });
      } else {
        await tx.toeicRunAnswer.create({
          data: {
            runId: run.id,
            toeicQuestionId,
            selectedKey,
            status: ToeicRunQuestionStatus.SELECTED,
            answeredAt: now,
          },
        });
      }
    });

    return { graded: false };
  }

  private async submitGroupAnswer(
    runId: string,
    question: ToeicQuestionWithTestPart,
    selectedKey: ToeicQuestionOptionKey,
    answerKey: ToeicQuestionOptionKey,
    isReviewWrongSubmission: boolean,
  ): Promise<SubmitToeicAnswerResponse> {
    let graded = false;
    let idempotentResult: boolean | undefined;

    await this.runRepository.transaction(async (tx) => {
      const run = await this.lockOpenRun(tx, runId);
      const existingAnswer = await tx.toeicRunAnswer.findUnique({
        where: {
          runId_toeicQuestionId: { runId, toeicQuestionId: question.id },
        },
      });

      if (existingAnswer?.status === ToeicRunQuestionStatus.RIGHT) {
        if (existingAnswer.selectedKey !== selectedKey) {
          throw new BadRequestException('Graded answers cannot be changed.');
        }

        idempotentResult = true;
        return;
      }

      if (
        existingAnswer?.status === ToeicRunQuestionStatus.WRONG &&
        !isReviewWrongSubmission
      ) {
        if (existingAnswer.selectedKey === selectedKey) {
          idempotentResult = false;
          return;
        }

        throw new BadRequestException('Graded answers cannot be changed.');
      }

      const now = new Date();
      if (existingAnswer) {
        await tx.toeicRunAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedKey,
            status: ToeicRunQuestionStatus.SELECTED,
            answeredAt: now,
            gradedAt: null,
          },
        });
      } else {
        await tx.toeicRunAnswer.create({
          data: {
            runId: run.id,
            toeicQuestionId: question.id,
            selectedKey,
            status: ToeicRunQuestionStatus.SELECTED,
            answeredAt: now,
          },
        });
      }

      const groupQuestions = await tx.toeicQuestion.findMany({
        where: { groupId: question.group.id },
        select: { id: true, answerKey: true },
        orderBy: { questionNumber: 'asc' },
      });
      const groupQuestionIds = groupQuestions.map((item) => item.id);
      const groupAnswers = await tx.toeicRunAnswer.findMany({
        where: { runId, toeicQuestionId: { in: groupQuestionIds } },
      });
      const answerByQuestionId = new Map(
        groupAnswers.map((answer) => [answer.toeicQuestionId, answer]),
      );
      const gradeStates: ToeicRunQuestionGradeState[] = groupQuestionIds.map(
        (questionId) => {
          const answer = answerByQuestionId.get(questionId);
          return {
            selectedKey: answer?.selectedKey ?? null,
            status: answer?.status ?? null,
          };
        },
      );

      if (isToeicRunGroupReadyToGrade(gradeStates, isReviewWrongSubmission)) {
        graded = true;
        await this.gradeRunGroup(tx, groupQuestions, answerByQuestionId);
      }

      await this.recalculateRunTotals(tx, runId);
    });

    if (idempotentResult !== undefined) {
      return this.buildGradedResponse(question, answerKey, idempotentResult);
    }

    return graded
      ? this.buildGradedResponse(question, answerKey, selectedKey === answerKey)
      : { graded: false };
  }

  private async lockOpenRun(tx: Prisma.TransactionClient, runId: string) {
    const run = await this.runRepository.lockRunForUpdate(tx, runId);

    if (!run) {
      throw new NotFoundException('Practice session not found.');
    }

    if (run.completedAt) {
      throw new BadRequestException('TOEIC run is already completed.');
    }

    return run;
  }

  private async gradeRunGroup(
    tx: Prisma.TransactionClient,
    groupQuestions: Array<{ id: number; answerKey: string | null }>,
    answerByQuestionId: Map<
      number,
      { id: string; selectedKey: string; status: ToeicRunQuestionStatus }
    >,
  ): Promise<void> {
    for (const question of groupQuestions) {
      const answer = answerByQuestionId.get(question.id);
      if (!answer || answer.status === ToeicRunQuestionStatus.RIGHT) {
        continue;
      }

      const answerKey = parseAnswerKey(question.answerKey);
      const selectedKey = answer.selectedKey.trim().toUpperCase();
      if (!answerKey || !isToeicQuestionOptionKey(selectedKey)) {
        continue;
      }

      await tx.toeicRunAnswer.update({
        where: { id: answer.id },
        data: {
          selectedKey,
          status:
            selectedKey === answerKey
              ? ToeicRunQuestionStatus.RIGHT
              : ToeicRunQuestionStatus.WRONG,
          gradedAt: new Date(),
        },
      });
    }
  }

  private async recalculateRunTotals(
    tx: Prisma.TransactionClient,
    runId: string,
  ): Promise<void> {
    const [totalRight, totalWrong] = await Promise.all([
      tx.toeicRunAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicRunAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);

    await tx.toeicRun.update({
      where: { id: runId },
      data: { totalRight, totalWrong },
    });
  }
}

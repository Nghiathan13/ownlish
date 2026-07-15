import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
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
import type { ToeicRunQuestionGradeState } from '../toeic-run/grader.types';
import type {
  PartPracticeQuestionWithTestPart,
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

    return this.submitGroupAnswer(
      run.id,
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

      const existingAnswer = await tx.toeicPartPracticeAnswer.findUnique({
        where: {
          runId_toeicQuestionId: {
            runId,
            toeicQuestionId: question.id,
          },
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
        existingAnswer &&
        existingAnswer.status === ToeicRunQuestionStatus.WRONG &&
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
        await tx.toeicPartPracticeAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedKey,
            status: ToeicRunQuestionStatus.SELECTED,
            answeredAt: now,
            gradedAt: null,
          },
        });
      } else {
        await tx.toeicPartPracticeAnswer.create({
          data: {
            runId,
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
      const groupQuestionIds = groupQuestions.map((q) => q.id);

      const groupAnswers = await tx.toeicPartPracticeAnswer.findMany({
        where: { runId, toeicQuestionId: { in: groupQuestionIds } },
      });

      const answerByQuestionId = new Map(
        groupAnswers.map((a) => [a.toeicQuestionId, a]),
      );

      const gradeStates: ToeicRunQuestionGradeState[] = groupQuestionIds.map(
        (qId) => {
          const answer = answerByQuestionId.get(qId);
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
    groupQuestions: Array<{ id: number; answerKey: string | null }>,
    answerByQuestionId: Map<
      number,
      { id: string; selectedKey: string; status: ToeicRunQuestionStatus }
    >,
  ): Promise<void> {
    for (const q of groupQuestions) {
      const answer = answerByQuestionId.get(q.id);

      if (!answer || answer.status === ToeicRunQuestionStatus.RIGHT) {
        continue;
      }

      const qAnswerKey = parseAnswerKey(q.answerKey);
      const qSelectedKey = answer.selectedKey?.trim().toUpperCase();

      if (
        !qAnswerKey ||
        !qSelectedKey ||
        !isToeicQuestionOptionKey(qSelectedKey)
      ) {
        continue;
      }

      const isCorrect = qSelectedKey === qAnswerKey;

      await tx.toeicPartPracticeAnswer.update({
        where: { id: answer.id },
        data: {
          selectedKey: qSelectedKey,
          status: isCorrect
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
      tx.toeicPartPracticeAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicPartPracticeAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);

    await tx.toeicPartPracticeRun.update({
      where: { id: runId },
      data: { totalRight, totalWrong },
    });
  }
}

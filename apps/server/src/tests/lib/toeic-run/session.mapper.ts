import { Injectable, NotFoundException } from '@nestjs/common';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  countOptions,
  isToeicQuestionOptionKey,
  mapQuestionOptions,
  parseAnswerKey,
} from '../toeic-question-mapper';
import {
  formatToeicGroupStatus,
  formatToeicQuestionCorrectness,
  formatToeicQuestionStatus,
  formatToeicRunMode,
} from './session.formatters';
import type {
  FormatToeicSessionResponseOptions,
  ToeicRunForResponse,
  ToeicRunGroupForResponse,
} from './session.types';
import type { ToeicSessionResponse } from './session.response.types';
import { TestsStorageService } from '../../tests-storage.service';

@Injectable()
export class ToeicRunSessionMapper {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: TestsStorageService,
  ) {}

  async formatSessionResponse(
    session: ToeicRunForResponse,
    visibleParts = session.selectedParts,
    options?: FormatToeicSessionResponseOptions,
  ): Promise<ToeicSessionResponse> {
    const visiblePartSet = new Set(visibleParts);
    const visibleGroups = this.sortVisibleGroups(
      session.groups
        .filter((group) => visiblePartSet.has(group.partNumber))
        .filter(options?.groupFilter ?? (() => true)),
    );
    const signedUrls = await this.storageService.createSignedUrls(
      visibleGroups.flatMap((group) => [
        group.toeicQuestionGroup.audioStoragePath,
        group.toeicQuestionGroup.imageStoragePath,
      ]),
    );

    const answerByQuestionId = new Map(
      session.questions.map((answer) => [answer.toeicQuestionId, answer]),
    );
    const responseMode = options?.mode ?? formatToeicRunMode(session.mode);
    let nextSessionQuestionNumber = 1;
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: session.toeicTestId },
      select: { year: true },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    return {
      sessionId: session.id,
      mode: responseMode,
      testId: session.toeicTestId,
      year: test.year,
      partNumbers: visibleParts,
      totalQuestions: visibleGroups.reduce(
        (total, group) => total + group.questions.length,
        0,
      ),
      correctCount: session.totalRight,
      wrongCount: session.totalWrong,
      completedAt: session.completedAt?.toISOString() ?? null,
      groups: visibleGroups.map((group) => {
        const audioSigned = group.toeicQuestionGroup.audioStoragePath
          ? signedUrls.get(group.toeicQuestionGroup.audioStoragePath)
          : null;
        const imageSigned = group.toeicQuestionGroup.imageStoragePath
          ? signedUrls.get(group.toeicQuestionGroup.imageStoragePath)
          : null;
        const questions = group.questions.map((question) => {
          const answer = answerByQuestionId.get(question.toeicQuestionId);
          const answerStatus = answer?.status ?? null;
          const isReviewRetryQuestion =
            responseMode === 'review_wrong' &&
            answerStatus !== ToeicRunQuestionStatus.RIGHT;
          const selectedKey = isReviewRetryQuestion
            ? null
            : answer?.selectedKey?.trim().toUpperCase();
          const answerKey = parseAnswerKey(question.toeicQuestion.answerKey);
          const sessionQuestionNumber = nextSessionQuestionNumber;
          nextSessionQuestionNumber += 1;

          return {
            id: question.toeicQuestionId,
            questionNumber: question.toeicQuestion.questionNumber,
            sessionQuestionNumber,
            question: question.toeicQuestion.question,
            questionVi: question.toeicQuestion.questionVi,
            options: mapQuestionOptions(question.toeicQuestion),
            optionCount: countOptions(question.toeicQuestion),
            answerKey,
            selectedKey:
              selectedKey && isToeicQuestionOptionKey(selectedKey)
                ? selectedKey
                : null,
            status: isReviewRetryQuestion
              ? null
              : formatToeicQuestionStatus(answerStatus),
            isCorrect: isReviewRetryQuestion
              ? null
              : formatToeicQuestionCorrectness(answerStatus),
          };
        });

        return {
          id: group.toeicQuestionGroupId,
          partNumber: group.partNumber,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          groupStatus: formatToeicGroupStatus(group.status),
          groupType: group.toeicQuestionGroup.groupType,
          accent: group.toeicQuestionGroup.accent,
          content: group.toeicQuestionGroup.content,
          contentVi: group.toeicQuestionGroup.contentVi,
          audioUrl: audioSigned?.url ?? null,
          audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
          imageUrl: imageSigned?.url ?? null,
          imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
          questions,
        };
      }),
    };
  }

  private sortVisibleGroups(groups: ToeicRunGroupForResponse[]) {
    return groups
      .map((group) => ({
        ...group,
        questions: [...group.questions].sort(
          (left, right) =>
            left.toeicQuestion.questionNumber -
            right.toeicQuestion.questionNumber,
        ),
      }))
      .sort(
        (left, right) =>
          left.partNumber - right.partNumber ||
          left.questionStart - right.questionStart ||
          left.questionEnd - right.questionEnd ||
          left.toeicQuestionGroupId - right.toeicQuestionGroupId,
      );
  }
}

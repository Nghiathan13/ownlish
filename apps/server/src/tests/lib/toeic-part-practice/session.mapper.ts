import { Injectable } from '@nestjs/common';
import { ToeicRunQuestionStatus } from '@prisma/client';
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
} from '../toeic-run/session.formatters';
import type { ToeicPartPracticeSessionResponse } from './session.response.types';
import type {
  FormatPartPracticeSessionResponseOptions,
  PartPracticeRunForResponse,
} from './session.types';
import { TestsStorageService } from '../../tests-storage.service';

@Injectable()
export class ToeicPartPracticeSessionMapper {
  constructor(private readonly storageService: TestsStorageService) {}

  async formatSessionResponse(
    session: PartPracticeRunForResponse,
    options: FormatPartPracticeSessionResponseOptions = {},
  ): Promise<ToeicPartPracticeSessionResponse> {
    const visibleGroups = session.groups.filter(
      options.groupFilter ?? (() => true),
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
    const responseMode = options.mode ?? 'practice';
    let nextSessionQuestionNumber = 1;

    return {
      sessionId: session.id,
      mode: responseMode,
      partNumber: session.partNumber,
      totalQuestions: visibleGroups.reduce(
        (total, group) => total + group.questions.length,
        0,
      ),
      correctCount: session.totalRight,
      wrongCount: session.totalWrong,
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
          testId: group.toeicTestId,
          year: group.test.year,
          testNumber: group.test.testNumber,
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
}

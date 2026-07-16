import { Injectable } from '@nestjs/common';
import {
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
  type ToeicQuestionGroup,
} from '@prisma/client';
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
} from './session.formatters';
import type {
  FormatToeicSessionResponseOptions,
  ToeicRunForResponse,
} from './session.types';
import type { ToeicSessionResponse } from './session.response.types';
import { TestsStorageService } from '../../tests-storage.service';
import { ToeicRunRepository } from './repository';

type CatalogGroup = ToeicQuestionGroup & {
  testPart: { partNumber: number };
  questions: ToeicQuestion[];
};

function getGroupStatus(statuses: ToeicRunQuestionStatus[]) {
  if (statuses.some((status) => status === ToeicRunQuestionStatus.WRONG)) {
    return ToeicRunGroupStatus.WRONG;
  }

  return statuses.length > 0 &&
    statuses.every((status) => status === ToeicRunQuestionStatus.RIGHT)
    ? ToeicRunGroupStatus.RIGHT
    : null;
}

@Injectable()
export class ToeicRunSessionMapper {
  constructor(
    private readonly storageService: TestsStorageService,
    private readonly repository: ToeicRunRepository,
  ) {}

  async formatSessionResponse(
    session: ToeicRunForResponse,
    visibleParts = session.selectedParts,
    options: FormatToeicSessionResponseOptions,
  ): Promise<ToeicSessionResponse> {
    const [catalogGroups, answers] = await Promise.all([
      this.repository.listFullQuestionGroupsForParts(
        session.toeicTestId,
        visibleParts,
      ),
      this.repository.listAnswersForRun(session.id),
    ]);
    const responseMode =
      options.mode ??
      (session.mode === ToeicRunMode.MOCK_TEST ? 'mock_test' : 'practice');
    const answerByQuestionId = new Map(
      answers.map((answer) => [answer.toeicQuestionId, answer]),
    );
    const completedMock =
      session.mode === ToeicRunMode.MOCK_TEST && session.completedAt != null;
    const visibleGroups = (catalogGroups as CatalogGroup[]).filter((group) => {
      if (responseMode !== 'review_wrong') {
        return true;
      }

      return group.questions.some(
        (question) =>
          answerByQuestionId.get(question.id)?.status ===
          ToeicRunQuestionStatus.WRONG,
      );
    });
    const signedUrls = await this.storageService.createSignedUrls(
      visibleGroups.flatMap((group) => [
        group.audioStoragePath,
        group.imageStoragePath,
      ]),
    );
    let nextSessionQuestionNumber = 1;

    return {
      sessionId: session.id,
      mode: responseMode,
      testId: session.toeicTestId,
      year: options.year,
      partNumbers: visibleParts,
      totalQuestions: visibleGroups.reduce(
        (total, group) => total + group.questions.length,
        0,
      ),
      correctCount: session.totalRight,
      wrongCount: session.totalWrong,
      completedAt: session.completedAt?.toISOString() ?? null,
      groups: visibleGroups.map((group) => {
        const statuses = group.questions
          .map(
            (question) =>
              answerByQuestionId.get(question.id)?.status ??
              (completedMock ? ToeicRunQuestionStatus.WRONG : null),
          )
          .filter((status): status is ToeicRunQuestionStatus => status != null);
        const audioSigned = group.audioStoragePath
          ? signedUrls.get(group.audioStoragePath)
          : null;
        const imageSigned = group.imageStoragePath
          ? signedUrls.get(group.imageStoragePath)
          : null;

        return {
          id: group.id,
          partNumber: group.testPart.partNumber,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          groupStatus: formatToeicGroupStatus(getGroupStatus(statuses)),
          groupType: group.groupType,
          accent: group.accent,
          content: group.content,
          contentVi: group.contentVi,
          audioUrl: audioSigned?.url ?? null,
          audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
          imageUrl: imageSigned?.url ?? null,
          imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
          questions: group.questions.map((question) => {
            const answer = answerByQuestionId.get(question.id);
            const answerStatus =
              answer?.status ??
              (completedMock ? ToeicRunQuestionStatus.WRONG : null);
            const reviewRetry =
              responseMode === 'review_wrong' &&
              answerStatus !== ToeicRunQuestionStatus.RIGHT;
            const sessionQuestionNumber = nextSessionQuestionNumber++;

            return {
              id: question.id,
              questionNumber: question.questionNumber,
              sessionQuestionNumber,
              question: question.question,
              questionVi: question.questionVi,
              options: mapQuestionOptions(question),
              optionCount: countOptions(question),
              answerKey: parseAnswerKey(question.answerKey),
              selectedKey: reviewRetry
                ? null
                : answer?.selectedKey &&
                    isToeicQuestionOptionKey(answer.selectedKey)
                  ? answer.selectedKey
                  : null,
              status: reviewRetry
                ? null
                : formatToeicQuestionStatus(answerStatus),
              isCorrect: reviewRetry
                ? null
                : formatToeicQuestionCorrectness(answerStatus),
            };
          }),
        };
      }),
    };
  }
}

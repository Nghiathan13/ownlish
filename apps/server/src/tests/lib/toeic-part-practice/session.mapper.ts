import { Injectable } from '@nestjs/common';
import {
  ToeicRunGroupStatus,
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
} from '../toeic-run/session.formatters';
import type { ToeicPartPracticeSessionResponse } from './session.response.types';
import type {
  FormatPartPracticeSessionResponseOptions,
  PartPracticeRunForResponse,
} from './session.types';
import { TestsStorageService } from '../../tests-storage.service';
import { ToeicPartPracticeRepository } from './repository';

type CatalogGroup = ToeicQuestionGroup & {
  testPart: {
    partNumber: number;
    testId: number;
    test: { year: number; testNumber: number };
  };
  questions: ToeicQuestion[];
};

function computeGroupStatus(
  statuses: (ToeicRunQuestionStatus | null)[],
): ToeicRunGroupStatus | null {
  if (statuses.length === 0) {
    return null;
  }

  if (statuses.some((s) => s === ToeicRunQuestionStatus.WRONG)) {
    return ToeicRunGroupStatus.WRONG;
  }

  if (statuses.every((s) => s === ToeicRunQuestionStatus.RIGHT)) {
    return ToeicRunGroupStatus.RIGHT;
  }

  return null;
}

@Injectable()
export class ToeicPartPracticeSessionMapper {
  constructor(
    private readonly storageService: TestsStorageService,
    private readonly repository: ToeicPartPracticeRepository,
  ) {}

  async formatSessionResponse(
    session: PartPracticeRunForResponse,
    options: FormatPartPracticeSessionResponseOptions = {},
  ): Promise<ToeicPartPracticeSessionResponse> {
    const [catalogGroups, answers] = await Promise.all([
      this.repository.listFullQuestionGroupsForPart(session.partNumber),
      this.repository.listAnswersForRun(session.id),
    ]);

    const answerByQuestionId = new Map(
      answers.map((answer) => [answer.toeicQuestionId, answer]),
    );
    const responseMode = options.mode ?? 'practice';

    const allGroupData = (catalogGroups as CatalogGroup[]).map((group) => {
      const rawQuestionStatuses = group.questions.map(
        (q) => answerByQuestionId.get(q.id)?.status ?? null,
      );
      const rawGroupStatus = computeGroupStatus(rawQuestionStatuses);

      return { group, rawGroupStatus };
    });

    const visibleGroupData =
      responseMode === 'review_wrong'
        ? allGroupData.filter(
            ({ rawGroupStatus, group }) =>
              rawGroupStatus === ToeicRunGroupStatus.WRONG ||
              group.questions.some(
                (q) =>
                  answerByQuestionId.get(q.id)?.status ===
                  ToeicRunQuestionStatus.WRONG,
              ),
          )
        : allGroupData;

    const signedUrls = await this.storageService.createSignedUrls(
      visibleGroupData.flatMap(({ group }) => [
        group.audioStoragePath,
        group.imageStoragePath,
      ]),
    );

    let nextSessionQuestionNumber = 1;

    const responseGroups = visibleGroupData.map(({ group, rawGroupStatus }) => {
      const audioSigned = group.audioStoragePath
        ? signedUrls.get(group.audioStoragePath)
        : null;
      const imageSigned = group.imageStoragePath
        ? signedUrls.get(group.imageStoragePath)
        : null;

      const questions = group.questions.map((question) => {
        const answer = answerByQuestionId.get(question.id);
        const answerStatus = answer?.status ?? null;
        const isReviewRetryQuestion =
          responseMode === 'review_wrong' &&
          answerStatus !== ToeicRunQuestionStatus.RIGHT;
        const selectedKey = isReviewRetryQuestion
          ? null
          : answer?.selectedKey?.trim().toUpperCase();
        const answerKey = parseAnswerKey(question.answerKey);
        const sessionQuestionNumber = nextSessionQuestionNumber;
        nextSessionQuestionNumber += 1;

        return {
          id: question.id,
          questionNumber: question.questionNumber,
          sessionQuestionNumber,
          question: question.question,
          questionVi: question.questionVi,
          options: mapQuestionOptions(question),
          optionCount: countOptions(question),
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
        id: group.id,
        testId: group.testPart.testId,
        year: group.testPart.test.year,
        testNumber: group.testPart.test.testNumber,
        partNumber: group.testPart.partNumber,
        questionStart: group.questionStart,
        questionEnd: group.questionEnd,
        groupStatus: formatToeicGroupStatus(rawGroupStatus),
        groupType: group.groupType,
        accent: group.accent,
        content: group.content,
        contentVi: group.contentVi,
        audioUrl: audioSigned?.url ?? null,
        audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
        imageUrl: imageSigned?.url ?? null,
        imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
        questions,
      };
    });

    return {
      sessionId: session.id,
      mode: responseMode,
      partNumber: session.partNumber,
      totalQuestions: responseGroups.reduce(
        (total, group) => total + group.questions.length,
        0,
      ),
      correctCount: session.totalRight,
      wrongCount: session.totalWrong,
      groups: responseGroups,
    };
  }
}

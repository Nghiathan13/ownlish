import {
  ToeicRunGroupStatus,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';
import type { PartPracticeRunForResponse } from '../lib/toeic-part-practice/session.types';
import { buildToeicQuestion } from './toeic-run.fixtures';

export function buildPartPracticeRunForResponse(
  overrides: Partial<PartPracticeRunForResponse> = {},
): PartPracticeRunForResponse {
  return {
    id: 'part-practice-run-id',
    partNumber: 1,
    totalRight: 0,
    totalWrong: 0,
    questions: [],
    groups: [],
    ...overrides,
  };
}

export function buildPartPracticePhotoRunGroup(
  overrides: {
    toeicQuestionGroupId?: number;
    toeicTestId?: number;
    partNumber?: number;
    questionStart?: number;
    questionEnd?: number;
    sortOrder?: number;
    status?: ToeicRunGroupStatus | null;
    year?: number;
    testNumber?: number;
    question?: ToeicQuestion;
    answerStatus?: ToeicRunQuestionStatus | null;
    selectedKey?: string | null;
  } = {},
) {
  const question = buildToeicQuestion({
    id: overrides.question?.id ?? 1001,
    groupId: overrides.toeicQuestionGroupId ?? 101,
    questionNumber: overrides.questionStart ?? 1,
    ...overrides.question,
  });

  return {
    toeicQuestionGroupId: overrides.toeicQuestionGroupId ?? 101,
    toeicTestId: overrides.toeicTestId ?? 1,
    partNumber: overrides.partNumber ?? 1,
    questionStart: overrides.questionStart ?? 1,
    questionEnd: overrides.questionEnd ?? 1,
    sortOrder: overrides.sortOrder ?? 0,
    status: overrides.status ?? null,
    test: {
      year: overrides.year ?? 2026,
      testNumber: overrides.testNumber ?? 1,
    },
    toeicQuestionGroup: {
      id: overrides.toeicQuestionGroupId ?? 101,
      groupType: 'photo',
      accent: null,
      content: 'Look at the picture.',
      contentVi: null,
      audioStoragePath: 'audio/part-1.mp3',
      imageStoragePath: null,
    },
    questions: [
      {
        toeicQuestionId: question.id,
        selectedKey: overrides.selectedKey ?? null,
        status: overrides.answerStatus ?? null,
        toeicQuestion: question,
      },
    ],
  };
}

import {
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';
import type { ToeicRunForResponse } from '../lib/toeic-run/session.types';

const defaultQuestionTimestamp = new Date('2026-06-01T00:00:00.000Z');

export function buildToeicQuestion(
  overrides: Partial<ToeicQuestion> = {},
): ToeicQuestion {
  return {
    id: 1001,
    groupId: 101,
    questionNumber: 1,
    question: 'Question 1',
    questionVi: null,
    questionType: null,
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D',
    optionAVi: null,
    optionBVi: null,
    optionCVi: null,
    optionDVi: null,
    answerKey: 'A',
    explanationVi: null,
    createdAt: defaultQuestionTimestamp,
    updatedAt: defaultQuestionTimestamp,
    ...overrides,
  };
}

export function buildToeicRunForResponse(
  overrides: Partial<ToeicRunForResponse> = {},
): ToeicRunForResponse {
  return {
    id: 'practice-run-id',
    mode: ToeicRunMode.PRACTICE,
    toeicTestId: 1,
    selectedParts: [1],
    totalRight: 0,
    totalWrong: 0,
    completedAt: null,
    questions: [],
    groups: [],
    ...overrides,
  };
}

export function buildPhotoRunGroup(
  overrides: {
    toeicQuestionGroupId?: number;
    partNumber?: number;
    questionStart?: number;
    questionEnd?: number;
    sortOrder?: number;
    status?: ToeicRunGroupStatus | null;
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
    partNumber: overrides.partNumber ?? 1,
    questionStart: overrides.questionStart ?? 1,
    questionEnd: overrides.questionEnd ?? 1,
    sortOrder: overrides.sortOrder ?? 0,
    status: overrides.status ?? null,
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

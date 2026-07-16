import { ToeicRunMode, type ToeicQuestion } from '@prisma/client';
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
    ...overrides,
  };
}

import type { ToeicQuestionOptionKey } from '../toeic-question-mapper';
import type { ToeicSessionResponseMode } from './session.types';

/** API contract for session payloads returned by /tests/runs*. */
export type ToeicQuestionOptionsResponse = {
  A: string | null;
  B: string | null;
  C: string | null;
  D: string | null;
  A_vi: string | null;
  B_vi: string | null;
  C_vi: string | null;
  D_vi: string | null;
};

export type ToeicSessionQuestionStatusResponse =
  | 'selected'
  | 'right'
  | 'wrong'
  | null;

export type ToeicSessionGroupStatusResponse = 'right' | 'wrong' | null;

export type ToeicSessionQuestionResponse = {
  id: number;
  questionNumber: number;
  sessionQuestionNumber: number;
  question: string | null;
  questionVi: string | null;
  options: ToeicQuestionOptionsResponse;
  optionCount: number;
  answerKey: ToeicQuestionOptionKey | null;
  selectedKey: ToeicQuestionOptionKey | null;
  status: ToeicSessionQuestionStatusResponse;
  isCorrect: boolean | null;
};

export type ToeicSessionGroupResponse = {
  id: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  groupStatus: ToeicSessionGroupStatusResponse;
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
  questions: ToeicSessionQuestionResponse[];
};

export type ToeicSessionResponse = {
  sessionId: string;
  mode: ToeicSessionResponseMode;
  testId: number;
  year: number;
  partNumbers: number[];
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  completedAt: string | null;
  groups: ToeicSessionGroupResponse[];
};

import type { ToeicSessionQuestionResponse } from '../toeic-run/session.response.types';

export type ToeicPartPracticeSessionMode = 'practice' | 'review_wrong';

export type ToeicPartPracticeGroupResponse = {
  id: number;
  testId: number;
  year: number;
  testNumber: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  groupStatus: 'right' | 'wrong' | null;
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

export type ToeicPartPracticeSessionResponse = {
  sessionId: string;
  mode: ToeicPartPracticeSessionMode;
  partNumber: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  groups: ToeicPartPracticeGroupResponse[];
};

export type PartPracticePartSummary = {
  partNumber: number;
  total: number;
  answered: number;
  correct: number;
  wrong: number;
};

export type ListPartPracticeSummaryResponse = {
  items: PartPracticePartSummary[];
};

export type ClearPartPracticeHistoryResponse = {
  resetRunCount: number;
};

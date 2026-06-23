export const E2E_TOEIC_YEAR = 2099;
export const E2E_TOEIC_TEST_NUMBER = 99;

export type ToeicSessionQuestionE2eBody = {
  id: number;
  questionNumber: number;
  sessionQuestionNumber: number;
  selectedKey: string | null;
  status: string | null;
  isCorrect: boolean | null;
};

export type ToeicSessionGroupE2eBody = {
  id: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  groupStatus: string | null;
  questions: ToeicSessionQuestionE2eBody[];
};

export type ToeicSessionE2eBody = {
  sessionId: string;
  mode: 'practice' | 'review_wrong' | 'mock_test';
  testId: number;
  year: number;
  partNumbers: number[];
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  completedAt: string | null;
  groups: ToeicSessionGroupE2eBody[];
};

export type SubmitToeicAnswerE2eBody = {
  graded: boolean;
  isCorrect?: boolean;
  answerKey?: 'A' | 'B' | 'C' | 'D';
  correctOptionEn?: string | null;
  correctOptionVi?: string | null;
};

export type ToeicTestListItemE2eBody = {
  id: number;
  year: number;
  testNumber: number;
  parts: Array<{
    partNumber: number;
    partCorrectCount: number;
    partWrongCount: number;
  }>;
};

export type ToeicTestListE2eBody = {
  items: ToeicTestListItemE2eBody[];
};

export type E2eToeicFixture = {
  testId: number;
  year: number;
  part1QuestionId: number;
  part2QuestionId: number;
};

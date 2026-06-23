export type ToeicTestSummary = {
  id: number;
  year: number;
  testNumber: number;
  parts: ToeicPartProgress[];
};

export type ToeicQuestionOptions = {
  A: string | null;
  B: string | null;
  C: string | null;
  D: string | null;
  A_vi: string | null;
  B_vi: string | null;
  C_vi: string | null;
  D_vi: string | null;
};

export type ToeicQuestion = {
  id: number;
  questionNumber: number;
  sessionQuestionNumber: number | null;
  question: string | null;
  questionVi: string | null;
  options: ToeicQuestionOptions;
  optionCount: number;
  answerKey: "A" | "B" | "C" | "D" | null;
  selectedKey: "A" | "B" | "C" | "D" | null;
  status: "selected" | "right" | "wrong" | null;
  isCorrect: boolean | null;
};

export type ToeicQuestionGroup = {
  id: number;
  partNumber: number | null;
  questionStart: number;
  questionEnd: number;
  groupStatus: "right" | "wrong" | null;
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
  questions: ToeicQuestion[];
};

export type SubmitAnswerResult = {
  graded: boolean;
  isCorrect?: boolean;
  answerKey?: "A" | "B" | "C" | "D";
  correctOptionEn?: string | null;
  correctOptionVi?: string | null;
};

export type ToeicRunResult = {
  sessionId: string;
  mode: ToeicRunMode;
  testId: number;
  year: number;
  partNumbers: number[];
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  completedAt: string | null;
  groups: ToeicQuestionGroup[];
};

export type ToeicRunMode = "practice" | "review_wrong" | "mock_test";

export type PracticeMode = Exclude<ToeicRunMode, "mock_test">;

export type ToeicPartProgress = {
  partNumber: number;
  partCorrectCount: number;
  partWrongCount: number;
};

export type RefreshMediaGroup = {
  id: number;
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
};

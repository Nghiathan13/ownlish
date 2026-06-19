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
  question: string | null;
  questionVi: string | null;
  options: ToeicQuestionOptions;
  optionCount: number;
  answerKey: "A" | "B" | "C" | "D" | null;
};

export type ToeicQuestionGroup = {
  id: number;
  questionStart: number;
  questionEnd: number;
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

export type ToeicPartResponse = {
  testId: number;
  partNumber: number;
  skill: "listening" | "reading";
  groups: ToeicQuestionGroup[];
};

export type SubmitAnswerResult = {
  graded: boolean;
  isCorrect?: boolean;
  answerKey?: "A" | "B" | "C" | "D";
  correctOptionEn?: string | null;
  correctOptionVi?: string | null;
};

export type PracticeSessionAnswer = {
  toeicQuestionId: number;
  selectedKey: "A" | "B" | "C" | "D";
  answerKey?: "A" | "B" | "C" | "D";
  isCorrect?: boolean;
};

export type PracticeSessionResult = {
  sessionId: string;
  correctCount: number;
  wrongCount: number;
  answers: PracticeSessionAnswer[];
};

export type PracticeMode = "practice" | "review_wrong";

export type WrongQuestionItem = {
  toeicQuestionId: number;
  questionNumber: number;
  wrongCount: number;
  lastWrongAt: string;
};

export type ToeicPartProgress = {
  partNumber: number;
  partCorrectCount: number;
  partWrongCount: number;
};

export type CompleteSessionResult = {
  correctCount: number;
  wrongCount: number;
};

export type RefreshMediaGroup = {
  id: number;
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
};

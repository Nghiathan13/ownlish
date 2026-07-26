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

export type ContentEvidenceSegment =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumbers: number[]; value: string };

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
  contentSegments?: ContentEvidenceSegment[] | null;
  contentViSegments?: ContentEvidenceSegment[] | null;
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
  questions: ToeicQuestion[];
};

export type PracticeMode = "practice" | "review_wrong";

export type ToeicRunMode = PracticeMode | "mock_test";

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

export type PartPracticePartSummary = {
  partNumber: number;
  total: number;
  answered: number;
  correct: number;
  wrong: number;
};

export type PartPracticeQuestionGroup = ToeicQuestionGroup & {
  testId: number;
  year: number;
  testNumber: number;
};

export type PartPracticeSessionResult = {
  sessionId: string;
  mode: PracticeMode;
  partNumber: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  groups: PartPracticeQuestionGroup[];
};

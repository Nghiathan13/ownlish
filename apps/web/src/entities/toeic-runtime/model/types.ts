export type RuntimeAnswerStatus = "selected" | "right" | "wrong";

export type ToeicRuntimeAnswer = {
  questionKey: string;
  selectedKey: "A" | "B" | "C" | "D";
  status: RuntimeAnswerStatus;
};

export type ToeicRuntimeRun = {
  sessionId: string;
  scope: "test" | "part_practice";
  testKey: string | null;
  partNumber: number | null;
  mode: "practice" | "mock_test";
  selectedParts: number[];
  correctCount: number;
  wrongCount: number;
  timer: {
    timeLimitSeconds: number;
    remainingSeconds: number;
  } | null;
  finish: { status: "open" | "pending" | "completed" };
  answers: ToeicRuntimeAnswer[];
};

export type ToeicRuntimePartPracticeSummary = {
  partNumber: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
};

export type ToeicRuntimeTestPracticeSummary = {
  testKey: string;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  parts: Array<{
    partNumber: number;
    correctCount: number;
    wrongCount: number;
  }>;
};

export type ToeicRuntimeMockHistoryItem = {
  sessionId: string;
  selectedParts: number[];
} & (
  | {
      status: "open" | "pending";
    }
  | {
      status: "completed";
      correctCount: number;
      wrongCount: number;
      score: {
        listening: number;
        reading: number;
        total: number;
      };
    }
);

export type ToeicRuntimeMockRunPreparation =
  | { status: "available" }
  | {
      status: "open" | "pending";
      run: {
        sessionId: string;
        selectedParts: number[];
      };
    };

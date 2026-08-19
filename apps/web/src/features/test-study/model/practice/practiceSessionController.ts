import type { usePartPracticeSession } from "./usePartPracticeSession";
import type { usePracticeSession } from "./usePracticeSession";

export type PracticeSessionController =
  | ReturnType<typeof usePracticeSession>
  | ReturnType<typeof usePartPracticeSession>;

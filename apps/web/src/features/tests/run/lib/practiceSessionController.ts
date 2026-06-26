import type { usePartPracticeSession } from "@/features/tests/run/hooks/usePartPracticeSession";
import type { usePracticeSession } from "@/features/tests/run/hooks/usePracticeSession";

export type PracticeSessionController =
  | ReturnType<typeof usePracticeSession>
  | ReturnType<typeof usePartPracticeSession>;

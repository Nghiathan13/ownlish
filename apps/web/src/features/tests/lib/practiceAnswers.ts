import type { PracticeSessionAnswer } from "@/features/tests/api/types";

export function hasPracticeSelection(
  answer?: PracticeSessionAnswer | null,
): boolean {
  return answer?.selectedKey != null;
}

export function isPracticeAnswerGraded(
  answer?: PracticeSessionAnswer | null,
): boolean {
  return (
    answer?.isCorrect !== undefined && answer.answerKey !== undefined
  );
}

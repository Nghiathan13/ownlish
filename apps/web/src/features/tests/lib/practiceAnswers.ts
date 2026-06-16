import type { PracticeSessionAnswer } from "@/features/tests/api/types";

export function isPracticeAnswerGraded(
  answer?: PracticeSessionAnswer | null,
): boolean {
  return (
    answer?.isCorrect !== undefined && answer.answerKey !== undefined
  );
}

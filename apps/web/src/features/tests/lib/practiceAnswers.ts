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

export type QuestionGridResult = "correct" | "wrong" | null;

export function getQuestionGridResultFromAnswer(
  answer?: PracticeSessionAnswer | null,
): QuestionGridResult {
  if (!isPracticeAnswerGraded(answer)) {
    return null;
  }

  return answer.isCorrect ? "correct" : "wrong";
}

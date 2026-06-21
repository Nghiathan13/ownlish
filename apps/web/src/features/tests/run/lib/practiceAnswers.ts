import type { ToeicQuestion } from "@/features/tests/shared/api/types";

export type PracticeAnswer = Pick<
  ToeicQuestion,
  "answerKey" | "isCorrect" | "selectedKey" | "status"
>;

export function hasPracticeSelection(
  answer?: PracticeAnswer | null,
): boolean {
  return answer?.selectedKey != null;
}

export function isPracticeAnswerGraded(
  answer?: PracticeAnswer | null,
): boolean {
  return answer?.status === "right" || answer?.status === "wrong";
}

export type QuestionGridResult = "correct" | "wrong" | null;

export function getQuestionGridResultFromAnswer(
  answer?: PracticeAnswer | null,
): QuestionGridResult {
  if (!answer || !isPracticeAnswerGraded(answer)) {
    return null;
  }

  return answer.isCorrect ? "correct" : "wrong";
}

export function isQuestionGridSelected(
  answer?: PracticeAnswer | null,
): boolean {
  if (!answer || isPracticeAnswerGraded(answer)) {
    return false;
  }

  return hasPracticeSelection(answer);
}

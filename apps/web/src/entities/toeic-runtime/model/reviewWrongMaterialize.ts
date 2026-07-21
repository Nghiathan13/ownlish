import type { ToeicQuestion } from "@/entities/toeic/api/types";
import type { RuntimeAnswerStatus } from "./types";

export function groupHasWrongAnswer(
  questionKeys: string[],
  answersByKey: Map<string, { status: RuntimeAnswerStatus }>,
) {
  return questionKeys.some(
    (questionKey) => answersByKey.get(questionKey)?.status === "wrong",
  );
}

export function maskReviewWrongQuestion(question: ToeicQuestion): ToeicQuestion {
  if (question.status === "right") {
    return question;
  }

  return {
    ...question,
    selectedKey: null,
    status: null,
    isCorrect: null,
  };
}

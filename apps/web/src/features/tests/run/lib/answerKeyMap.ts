import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";

export type OptionKey = "A" | "B" | "C" | "D";

export function buildAnswerKeyMap(
  groups: ToeicQuestionGroup[],
): Map<number, OptionKey> {
  const map = new Map<number, OptionKey>();

  for (const group of groups) {
    for (const question of group.questions) {
      if (question.answerKey) {
        map.set(question.id, question.answerKey);
      }
    }
  }

  return map;
}

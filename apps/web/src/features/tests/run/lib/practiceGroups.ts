import type { ToeicQuestion, ToeicQuestionGroup } from "@/features/tests/shared/api/types";

export type PracticeItem = {
  group: ToeicQuestionGroup;
  question: ToeicQuestion;
};

export type PracticeGroup = {
  group: ToeicQuestionGroup;
  questions: ToeicQuestion[];
};

export function buildPracticeGroups(items: PracticeItem[]): PracticeGroup[] {
  const groups = new Map<number, PracticeGroup>();

  for (const item of items) {
    const existing = groups.get(item.group.id);
    if (existing) {
      existing.questions.push(item.question);
      continue;
    }

    groups.set(item.group.id, {
      group: item.group,
      questions: [item.question],
    });
  }

  return Array.from(groups.values())
    .map((entry) => ({
      ...entry,
      questions: entry.questions.sort(
        (left, right) => left.questionNumber - right.questionNumber,
      ),
    }))
    .sort((left, right) => left.group.questionStart - right.group.questionStart);
}

export function buildWrongReviewGroups(
  groups: ToeicQuestionGroup[],
  wrongQuestionIds: number[],
): PracticeGroup[] {
  const wrongIds = new Set(wrongQuestionIds);

  return groups
    .filter((group) => group.questions.some((question) => wrongIds.has(question.id)))
    .map((group) => ({
      group,
      questions: [...group.questions].sort(
        (left, right) => left.questionNumber - right.questionNumber,
      ),
    }))
    .sort((left, right) => left.group.questionStart - right.group.questionStart);
}

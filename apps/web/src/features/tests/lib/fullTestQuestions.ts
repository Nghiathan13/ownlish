import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import type { PracticeItem } from "@/features/tests/lib/practiceGroups";

export type FullTestQuestionItem = PracticeItem & {
  partNumber: number;
  globalIndex: number;
};

function flattenPartItems(
  partNumber: number,
  groups: ToeicQuestionGroup[],
): Omit<FullTestQuestionItem, "globalIndex">[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question, partNumber })),
  );
}

export function buildFullTestQuestions(
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>,
): FullTestQuestionItem[] {
  const items: Omit<FullTestQuestionItem, "globalIndex">[] = [];

  for (let partNumber = 1; partNumber <= 7; partNumber += 1) {
    const groups = partGroups[partNumber];
    if (!groups) {
      continue;
    }

    items.push(...flattenPartItems(partNumber, groups));
  }

  items.sort(
    (left, right) => left.question.questionNumber - right.question.questionNumber,
  );

  return items.map((item, globalIndex) => ({ ...item, globalIndex }));
}

export function findGroupForQuestion(
  partGroups: ToeicQuestionGroup[],
  questionId: number,
): ToeicQuestionGroup | null {
  for (const group of partGroups) {
    if (group.questions.some((question) => question.id === questionId)) {
      return group;
    }
  }

  return null;
}

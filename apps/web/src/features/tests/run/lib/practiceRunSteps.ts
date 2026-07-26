import type { ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import type { PracticeGroup, PracticeItem } from "@/features/tests/run/lib/practiceGroups";

export type PracticeRunQuestionItem = PracticeItem & {
  partNumber: number;
};

export type PracticeRunQuestionStep = {
  kind: "question";
  partNumber: number;
  item: PracticeRunQuestionItem;
};

export type PracticeRunGroupStep = {
  kind: "group";
  partNumber: number;
  practiceGroup: PracticeGroup;
};

export type PracticeRunStep = PracticeRunQuestionStep | PracticeRunGroupStep;

function flattenPartItems(
  partNumber: number,
  groups: ToeicQuestionGroup[],
): PracticeRunQuestionItem[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question, partNumber })),
  );
}

function compareQuestionsWithinGroup(
  left: ToeicQuestionGroup["questions"][number],
  right: ToeicQuestionGroup["questions"][number],
) {
  const leftOrder = left.sessionQuestionNumber ?? left.questionNumber;
  const rightOrder = right.sessionQuestionNumber ?? right.questionNumber;
  return leftOrder - rightOrder;
}

export function buildAggregatePracticeRunQuestions(
  partNumber: number,
  groups: ToeicQuestionGroup[],
): PracticeRunQuestionItem[] {
  return flattenPartItems(partNumber, groups);
}

function buildStepsFromOrderedQuestions(
  questions: PracticeRunQuestionItem[],
): PracticeRunStep[] {
  const steps: PracticeRunStep[] = [];

  for (let index = 0; index < questions.length; ) {
    const item = questions[index];
    const partConfig = getPartPracticeConfig(item.partNumber);

    if (partConfig.navigationMode === "per-group") {
      const groupId = item.group.id;
      const groupItems: PracticeRunQuestionItem[] = [];

      while (index < questions.length && questions[index].group.id === groupId) {
        groupItems.push(questions[index]);
        index += 1;
      }

      steps.push({
        kind: "group",
        partNumber: item.partNumber,
        practiceGroup: {
          group: item.group,
          questions: groupItems
            .map((groupItem) => groupItem.question)
            .sort(compareQuestionsWithinGroup),
        },
      });
      continue;
    }

    steps.push({
      kind: "question",
      partNumber: item.partNumber,
      item,
    });
    index += 1;
  }

  return steps;
}

export function buildAggregatePracticeRunSteps(
  partNumber: number,
  groups: ToeicQuestionGroup[],
): PracticeRunStep[] {
  return buildStepsFromOrderedQuestions(
    buildAggregatePracticeRunQuestions(partNumber, groups),
  );
}

export function buildPracticeRunQuestions(
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>,
  selectedParts?: number[],
): PracticeRunQuestionItem[] {
  const allowedParts = new Set(
    selectedParts && selectedParts.length > 0
      ? selectedParts
      : [1, 2, 3, 4, 5, 6, 7],
  );
  const items: PracticeRunQuestionItem[] = [];

  for (let partNumber = 1; partNumber <= 7; partNumber += 1) {
    if (!allowedParts.has(partNumber)) {
      continue;
    }

    const groups = partGroups[partNumber];
    if (!groups) {
      continue;
    }

    items.push(...flattenPartItems(partNumber, groups));
  }

  items.sort(
    (left, right) => left.question.questionNumber - right.question.questionNumber,
  );

  return items;
}

export function buildPracticeRunSteps(
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>,
  selectedParts?: number[],
): PracticeRunStep[] {
  return buildStepsFromOrderedQuestions(
    buildPracticeRunQuestions(partGroups, selectedParts),
  );
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

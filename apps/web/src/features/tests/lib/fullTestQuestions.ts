import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import { readFullTestIndex } from "@/features/tests/lib/fullTestStorage";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import type { PracticeGroup, PracticeItem } from "@/features/tests/lib/practiceGroups";

export type FullTestQuestionItem = PracticeItem & {
  partNumber: number;
  globalIndex: number;
};

export type FullTestQuestionStep = {
  kind: "question";
  partNumber: number;
  item: FullTestQuestionItem;
};

export type FullTestGroupStep = {
  kind: "group";
  partNumber: number;
  practiceGroup: PracticeGroup;
};

export type FullTestStep = FullTestQuestionStep | FullTestGroupStep;

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

export function buildFullTestSteps(
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>,
): FullTestStep[] {
  const questions = buildFullTestQuestions(partGroups);
  const steps: FullTestStep[] = [];

  for (let index = 0; index < questions.length; ) {
    const item = questions[index];
    const partConfig = getPartPracticeConfig(item.partNumber);

    if (partConfig.navigationMode === "per-group") {
      const groupId = item.group.id;
      const groupItems: FullTestQuestionItem[] = [];

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
            .sort(
              (left, right) => left.questionNumber - right.questionNumber,
            ),
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

export function resolveInitialStepIndex(
  attemptId: string,
  steps: FullTestStep[],
  questions: FullTestQuestionItem[],
  currentPartNumber: number,
) {
  if (steps.length === 0) {
    return 0;
  }

  const savedIndex = readFullTestIndex(attemptId);
  if (savedIndex > 0) {
    if (savedIndex < steps.length) {
      return savedIndex;
    }

    if (questions.length > 0 && savedIndex < questions.length) {
      const targetQuestion = questions[savedIndex];
      const stepIndex = steps.findIndex((step) =>
        step.kind === "question"
          ? step.item.question.id === targetQuestion.question.id
          : step.practiceGroup.questions.some(
              (question) => question.id === targetQuestion.question.id,
            ),
      );

      if (stepIndex >= 0) {
        return stepIndex;
      }
    }
  }

  const partStartIndex = steps.findIndex(
    (step) => step.partNumber === currentPartNumber,
  );

  return partStartIndex >= 0 ? partStartIndex : 0;
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

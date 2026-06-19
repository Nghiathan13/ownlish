import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import { readPracticeRunIndex } from "@/features/tests/lib/practiceRunStorage";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import type { PracticeGroup, PracticeItem } from "@/features/tests/lib/practiceGroups";

export type PracticeRunQuestionItem = PracticeItem & {
  partNumber: number;
  globalIndex: number;
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

export function getStepQuestionStart(step: PracticeRunStep): number {
  return step.kind === "group"
    ? step.practiceGroup.group.questionStart
    : step.item.group.questionStart;
}

export function getMinQuestionNumberInSession(questionNumbers: number[]) {
  if (questionNumbers.length === 0) {
    return 1;
  }

  return Math.min(...questionNumbers);
}

export function toSessionQuestionDisplayNumber(
  questionNumber: number,
  minQuestionNumberInSession: number,
) {
  return questionNumber - minQuestionNumberInSession + 1;
}

function flattenPartItems(
  partNumber: number,
  groups: ToeicQuestionGroup[],
): Omit<PracticeRunQuestionItem, "globalIndex">[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question, partNumber })),
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
  const items: Omit<PracticeRunQuestionItem, "globalIndex">[] = [];

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

  return items.map((item, globalIndex) => ({ ...item, globalIndex }));
}

export function buildPracticeRunSteps(
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>,
  selectedParts?: number[],
): PracticeRunStep[] {
  const questions = buildPracticeRunQuestions(partGroups, selectedParts);
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
  sessionId: string,
  steps: PracticeRunStep[],
  questions: PracticeRunQuestionItem[],
  selectedParts: number[],
) {
  if (steps.length === 0) {
    return 0;
  }

  const savedIndex = readPracticeRunIndex(sessionId);
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

  const firstSelectedPart = selectedParts[0];
  if (firstSelectedPart == null) {
    return 0;
  }

  const partStartIndex = steps.findIndex(
    (step) => step.partNumber === firstSelectedPart,
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

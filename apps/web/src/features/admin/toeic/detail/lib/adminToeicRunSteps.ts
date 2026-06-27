import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawPart,
  AdminToeicTestRawQuestion,
} from "@/features/admin/toeic/api/types";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";

export type AdminToeicRunQuestionStep = {
  kind: "question";
  partNumber: number;
  group: AdminToeicTestRawGroup;
  question: AdminToeicTestRawQuestion;
};

export type AdminToeicRunGroupStep = {
  kind: "group";
  partNumber: number;
  group: AdminToeicTestRawGroup;
};

export type AdminToeicRunStep = AdminToeicRunQuestionStep | AdminToeicRunGroupStep;

export function getAdminStepGroup(step: AdminToeicRunStep): AdminToeicTestRawGroup {
  return step.group;
}

export function getAdminStepQuestions(step: AdminToeicRunStep): AdminToeicTestRawQuestion[] {
  if (step.kind === "question") {
    return [step.question];
  }

  return step.group.questions;
}

export function buildAdminToeicRunSteps(
  parts: AdminToeicTestRawPart[],
): AdminToeicRunStep[] {
  const steps: AdminToeicRunStep[] = [];

  for (const part of parts) {
    const partConfig = getPartPracticeConfig(part.partNumber);

    for (const group of part.groups) {
      if (partConfig.navigationMode === "per-group") {
        steps.push({
          kind: "group",
          partNumber: part.partNumber,
          group,
        });
        continue;
      }

      for (const question of group.questions) {
        steps.push({
          kind: "question",
          partNumber: part.partNumber,
          group,
          question,
        });
      }
    }
  }

  return steps;
}

export function findAdminStepIndexForQuestionId(
  steps: AdminToeicRunStep[],
  questionId: number,
) {
  return steps.findIndex((step) =>
    getAdminStepQuestions(step).some((question) => question.id === questionId),
  );
}

export function getActiveQuestionIdsForAdminStep(
  step: AdminToeicRunStep | null | undefined,
): Set<number> {
  if (!step) {
    return new Set();
  }

  return new Set(getAdminStepQuestions(step).map((question) => question.id));
}

export function countAdminToeicQuestions(steps: AdminToeicRunStep[]) {
  return steps.reduce(
    (total, step) => total + getAdminStepQuestions(step).length,
    0,
  );
}

export function getAdminStepQuestionPosition(
  steps: AdminToeicRunStep[],
  stepIndex: number,
) {
  if (steps.length === 0 || stepIndex < 0) {
    return 0;
  }

  const boundedIndex = Math.min(stepIndex, steps.length - 1);
  let position = 0;

  for (let index = 0; index < boundedIndex; index += 1) {
    position += getAdminStepQuestions(steps[index]).length;
  }

  return position + 1;
}

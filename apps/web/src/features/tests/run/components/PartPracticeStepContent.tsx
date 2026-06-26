"use client";

import { PracticeGroupScreen } from "@/features/tests/run/components/PracticeGroupScreen";
import type { PartPracticeQuestionGroup } from "@/entities/toeic/api/types";
import type { PracticeSessionController } from "@/features/tests/run/lib/practiceSessionController";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";

type PartPracticeStepContentProps = {
  step: PracticeRunStep;
  practice: PracticeSessionController;
  sessionId: string;
  testIdByGroupId: Map<number, number>;
};

function resolveGroupTestId(
  groupId: number,
  testIdByGroupId: Map<number, number>,
) {
  const testId = testIdByGroupId.get(groupId);
  if (testId == null) {
    throw new Error(`Missing testId for group ${groupId}`);
  }

  return testId;
}

export function PartPracticeStepContent({
  step,
  practice,
  sessionId,
  testIdByGroupId,
}: PartPracticeStepContentProps) {
  if (step.kind === "group") {
    return (
      <PracticeGroupScreen
        key={`${step.practiceGroup.group.id}-${sessionId}`}
        partNumber={step.partNumber}
        practice={practice}
        practiceGroup={step.practiceGroup}
        testId={resolveGroupTestId(step.practiceGroup.group.id, testIdByGroupId)}
      />
    );
  }

  return (
    <PracticeGroupScreen
      key={`${step.item.question.id}-${sessionId}`}
      partNumber={step.partNumber}
      practice={practice}
      practiceGroup={{
        group: step.item.group,
        questions: [step.item.question],
      }}
      testId={resolveGroupTestId(step.item.group.id, testIdByGroupId)}
    />
  );
}

export function buildPartPracticeTestIdMap(groups: PartPracticeQuestionGroup[]) {
  const map = new Map<number, number>();

  for (const group of groups) {
    map.set(group.id, group.testId);
  }

  return map;
}

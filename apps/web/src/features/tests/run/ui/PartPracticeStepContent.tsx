"use client";

import type { PracticeSessionController } from "@/features/tests/run/model/practice/practiceSessionController";
import { PracticeGroupScreen } from "@/features/tests/run/ui/practice/PracticeGroupScreen";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";

type PartPracticeStepContentProps = {
  step: PracticeRunStep;
  practice: PracticeSessionController;
  sessionId: string;
};

export function PartPracticeStepContent({
  step,
  practice,
  sessionId,
}: PartPracticeStepContentProps) {
  if (step.kind === "group") {
    return (
      <PracticeGroupScreen
        key={`${step.practiceGroup.group.id}-${sessionId}`}
        partNumber={step.partNumber}
        practice={practice}
        practiceGroup={step.practiceGroup}
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
    />
  );
}

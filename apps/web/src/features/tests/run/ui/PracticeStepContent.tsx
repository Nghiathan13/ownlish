"use client";

import type { usePracticeSession } from "@/features/tests/run/model/practice/usePracticeSession";
import { PracticeGroupScreen } from "@/features/tests/run/ui/practice/PracticeGroupScreen";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";

type PracticeStepContentProps = {
  step: PracticeRunStep;
  practice: ReturnType<typeof usePracticeSession>;
  sessionId: string;
};

export function PracticeStepContent({
  step,
  practice,
  sessionId,
}: PracticeStepContentProps) {
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

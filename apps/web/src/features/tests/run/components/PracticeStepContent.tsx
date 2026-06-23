"use client";

import { PracticeGroupScreen } from "@/features/tests/run/components/PracticeGroupScreen";
import type { usePracticeSession } from "@/features/tests/run/hooks/usePracticeSession";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";

type PracticeStepContentProps = {
  testId: number;
  step: PracticeRunStep;
  practice: ReturnType<typeof usePracticeSession>;
  sessionId: string;
};

export function PracticeStepContent({
  testId,
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
        testId={testId}
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
      testId={testId}
    />
  );
}

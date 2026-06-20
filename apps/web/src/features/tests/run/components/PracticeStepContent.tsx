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
        groups={[step.practiceGroup]}
        initialGroupIndex={0}
        key={`${step.practiceGroup.group.id}-${sessionId}`}
        navigation={null}
        partNumber={step.partNumber}
        practice={practice}
        testId={testId}
      />
    );
  }

  return (
    <PracticeGroupScreen
      groups={[
        {
          group: step.item.group,
          questions: [step.item.question],
        },
      ]}
      initialGroupIndex={0}
      key={`${step.item.question.id}-${sessionId}`}
      navigation={null}
      partNumber={step.partNumber}
      practice={practice}
      testId={testId}
    />
  );
}

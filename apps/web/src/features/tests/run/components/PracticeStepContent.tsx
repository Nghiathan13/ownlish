"use client";

import { PracticeGroupScreen } from "@/features/tests/run/components/PracticeGroupScreen";
import type { usePracticeSession } from "@/features/tests/run/hooks/usePracticeSession";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";

type PracticeStepContentProps = {
  testId: number;
  step: PracticeRunStep;
  practice: ReturnType<typeof usePracticeSession>;
  sessionId: string;
  accessToken: string | null;
  clearSession: () => void;
};

export function PracticeStepContent({
  testId,
  step,
  practice,
  sessionId,
  accessToken,
  clearSession,
}: PracticeStepContentProps) {
  if (step.kind === "group") {
    return (
      <PracticeGroupScreen
        accessToken={accessToken}
        clearSession={clearSession}
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
      accessToken={accessToken}
      clearSession={clearSession}
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

"use client";

import { ListeningGroupPracticeContent } from "@/features/tests/components/ListeningGroupPracticeContent";
import { PracticeQuestionScreen } from "@/features/tests/components/PracticeQuestionScreen";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import type { FullTestStep } from "@/features/tests/lib/fullTestQuestions";

type PracticeAttemptStepContentProps = {
  testId: number;
  step: FullTestStep;
  practice: ReturnType<typeof usePracticeSession>;
  sessionId: string;
  accessToken: string | null;
  clearSession: () => void;
};

export function PracticeAttemptStepContent({
  testId,
  step,
  practice,
  sessionId,
  accessToken,
  clearSession,
}: PracticeAttemptStepContentProps) {
  if (step.kind === "group") {
    return (
      <ListeningGroupPracticeContent
        accessToken={accessToken}
        clearSession={clearSession}
        groups={[step.practiceGroup]}
        initialGroupIndex={0}
        key={`${step.practiceGroup.group.id}-${sessionId}`}
        navigation={null}
        partNumber={step.partNumber}
        practice={practice}
        practiceMode="normal"
        testId={testId}
      />
    );
  }

  return (
    <PracticeQuestionScreen
      accessToken={accessToken}
      clearSession={clearSession}
      item={step.item}
      key={`${step.item.question.id}-${sessionId}`}
      partNumber={step.partNumber}
      practice={practice}
      testId={testId}
    />
  );
}

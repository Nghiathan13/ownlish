"use client";

import { ListeningGroupPracticeContent } from "@/features/tests/components/ListeningGroupPracticeContent";
import { PracticeQuestionScreen } from "@/features/tests/components/PracticeQuestionScreen";
import type { PracticeMode } from "@/features/tests/api/types";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import type { FullTestStep } from "@/features/tests/lib/fullTestQuestions";

type PracticeAttemptStepContentProps = {
  testId: number;
  step: FullTestStep;
  practice: ReturnType<typeof usePracticeSession>;
  normalPractice?: ReturnType<typeof usePracticeSession>;
  sessionId: string;
  practiceMode?: PracticeMode;
  accessToken: string | null;
  clearSession: () => void;
};

export function PracticeAttemptStepContent({
  testId,
  step,
  practice,
  normalPractice,
  sessionId,
  practiceMode = "practice",
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
        normalPractice={normalPractice}
        partNumber={step.partNumber}
        practice={practice}
        practiceMode={practiceMode}
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
      practiceMode={practiceMode}
      testId={testId}
    />
  );
}

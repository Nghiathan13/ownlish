
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PracticeAttemptStepContent } from "@/features/tests/components/PracticeAttemptStepContent";
import { PracticeContinuousShell } from "@/features/tests/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import type { PracticeMode, ToeicQuestionGroup } from "@/features/tests/api/types";
import {
  buildFullTestQuestions,
  buildFullTestSteps,
  resolveInitialStepIndex,
} from "@/features/tests/lib/fullTestQuestions";
import { writeFullTestIndex } from "@/features/tests/lib/fullTestStorage";
import { getQuestionGridResultFromAnswer } from "@/features/tests/lib/practiceAnswers";
import {
  buildFullTestGridSections,
  findStepIndexForQuestion,
  getActiveQuestionNumbersForStep,
  getPrimaryActiveQuestionNumber,
  getTotalQuestionCountFromSections,
} from "@/features/tests/lib/practiceQuestionGrid";
import { normalizeSelectedParts } from "@/features/tests/lib/toeicParts";
import { useRegisterPracticeQuestionNav } from "@/features/tests/hooks/useRegisterPracticeQuestionNav";
import { useRegisterPracticeExit } from "@/features/tests/providers/PracticeExitProvider";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PracticeRunViewProps = {
  testId: number;
  selectedParts: number[];
  accessToken: string | null;
  clearSession: () => void;
  practiceMode?: PracticeMode;
};

function getPracticeStorageKey(sessionId: string) {
  return `practice-${sessionId}`;
}

export function PracticeRunView({
  testId,
  selectedParts,
  accessToken,
  clearSession,
  practiceMode = "practice",
}: PracticeRunViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const initializedStorageKeyRef = useRef<string | null>(null);
  const normalizedSelectedParts = useMemo(
    () => normalizeSelectedParts(selectedParts),
    [selectedParts],
  );
  const primaryPartNumber = normalizedSelectedParts[0] ?? 1;
  const isWrongMode = practiceMode === "review_wrong";
  const practice = usePracticeSession({
    accessToken,
    clearSession,
    enabled: normalizedSelectedParts.length > 0,
    mode: practiceMode,
    partNumber: primaryPartNumber,
    selectedParts: normalizedSelectedParts,
    testId,
  });

  const partGroups = useMemo(() => {
    const groupsByPart: Record<number, ToeicQuestionGroup[]> = {};

    for (const group of practice.groups) {
      if (group.partNumber == null) {
        continue;
      }

      groupsByPart[group.partNumber] = [
        ...(groupsByPart[group.partNumber] ?? []),
        group,
      ];
    }

    return groupsByPart;
  }, [practice.groups]);

  const questions = useMemo(
    () => buildFullTestQuestions(partGroups, normalizedSelectedParts),
    [partGroups, normalizedSelectedParts],
  );

  const steps = useMemo(
    () => buildFullTestSteps(partGroups, normalizedSelectedParts),
    [partGroups, normalizedSelectedParts],
  );

  const storageKey = practice.sessionId
    ? getPracticeStorageKey(practice.sessionId)
    : null;

  useEffect(() => {
    if (
      !storageKey ||
      steps.length === 0 ||
      initializedStorageKeyRef.current === storageKey
    ) {
      return;
    }

    initializedStorageKeyRef.current = storageKey;
    setStepIndex(
      resolveInitialStepIndex(
        storageKey,
        steps,
        questions,
        normalizedSelectedParts,
      ),
    );
  }, [normalizedSelectedParts, questions, steps, storageKey]);

  const activeStepIndex =
    steps.length === 0 ? 0 : Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[activeStepIndex] ?? null;

  const goToStepIndex = useCallback(
    (nextIndex: number) => {
      if (!storageKey || steps.length === 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
      if (boundedIndex === activeStepIndex) {
        return;
      }

      setStepIndex(boundedIndex);
      writeFullTestIndex(storageKey, boundedIndex);
    },
    [activeStepIndex, steps.length, storageKey],
  );

  const handleExit = useCallback(async () => {
    if (isWrongMode && practice.sessionId) {
      await practice.completeSession();
    }

    await queryClient.invalidateQueries({
      queryKey: ["tests"],
    });
  }, [isWrongMode, practice, queryClient]);

  useRegisterPracticeExit(
    practice.sessionId ? handleExit : null,
    isWrongMode ? `Test ${testId} · Review wrong` : `Test ${testId}`,
  );

  const activeQuestionNumbers = useMemo(
    () => getActiveQuestionNumbersForStep(currentStep),
    [currentStep],
  );

  const questionGridSections = useMemo(
    () =>
      buildFullTestGridSections(
        steps,
        normalizedSelectedParts,
        activeQuestionNumbers,
        (questionId) => getQuestionGridResultFromAnswer(practice.getAnswer(questionId)),
      ),
    [activeQuestionNumbers, normalizedSelectedParts, practice, steps],
  );

  const totalQuestions = getTotalQuestionCountFromSections(questionGridSections);
  const currentQuestionNumber = getPrimaryActiveQuestionNumber(
    activeQuestionNumbers,
    currentStep?.kind === "group"
      ? currentStep.practiceGroup.group.questionStart
      : undefined,
  );

  useRegisterPracticeQuestionNav({
    currentQuestionNumber,
    enabled: practice.sessionId != null && steps.length > 0,
    totalQuestions,
  });

  const isLastStep = activeStepIndex >= steps.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      isQuestionGridOpen={isQuestionGridOpen}
      nextAriaLabel="Next"
      nextDisabled={isLastStep}
      onNext={() => {
        goToStepIndex(activeStepIndex + 1);
      }}
      onPrevious={() => {
        goToStepIndex(activeStepIndex - 1);
      }}
      onQuestionGridOpenChange={setIsQuestionGridOpen}
      onQuestionGridSelect={(questionNumber) => {
        const stepIndexForQuestion = findStepIndexForQuestion(steps, questionNumber);
        if (stepIndexForQuestion >= 0) {
          goToStepIndex(stepIndexForQuestion);
        }
      }}
      previousDisabled={activeStepIndex === 0}
      questionGridSections={questionGridSections}
    />
  );

  if (
    practice.isStarting
  ) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (practice.startError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {practice.startError}
          </p>
          <div className="mt-4">
            <Button onClick={() => router.push("/tests")} type="button" variant="secondary">
              Back to tests
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (steps.length === 0) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {isWrongMode
              ? "No wrong questions left to review for the selected parts."
              : "This practice has no questions yet. Check that TOEIC data is imported."}
          </p>
        </Panel>
      </PageShell>
    );
  }

  if (!currentStep || !practice.sessionId) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PracticeContinuousShell navigation={navigationBar}>
      <PracticeAttemptStepContent
        accessToken={accessToken}
        clearSession={clearSession}
        practice={practice}
        practiceMode={practiceMode}
        sessionId={practice.sessionId}
        step={currentStep}
        testId={testId}
      />
    </PracticeContinuousShell>
  );
}

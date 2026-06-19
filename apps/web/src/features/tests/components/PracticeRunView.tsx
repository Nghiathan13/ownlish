
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PracticeAttemptStepContent } from "@/features/tests/components/PracticeAttemptStepContent";
import { PracticeContinuousShell } from "@/features/tests/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { useTestPartGroups } from "@/features/tests/hooks/useTestPartGroups";
import { getPracticeStatsQueryKey } from "@/features/tests/hooks/usePracticeStats";
import { buildAnswerKeyMap } from "@/features/tests/lib/answerKeyMap";
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
import { useRegisterPracticeQuestionNav } from "@/features/tests/hooks/useRegisterPracticeQuestionNav";
import { useRegisterPracticeExit } from "@/features/tests/providers/PracticeExitProvider";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PracticeRunViewProps = {
  testId: number;
  testLabel: string;
  selectedParts: number[];
  accessToken: string | null;
  clearSession: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getPracticeStorageKey(sessionId: string) {
  return `practice-${sessionId}`;
}

export function PracticeRunView({
  testId,
  testLabel,
  selectedParts,
  accessToken,
  clearSession,
}: PracticeRunViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const initializedStorageKeyRef = useRef<string | null>(null);

  const {
    allPartsLoaded,
    isLoadingParts,
    normalizedSelectedParts,
    partGroups,
    partLoadError,
  } = useTestPartGroups({
    accessToken,
    clearSession,
    selectedParts,
    testId,
  });

  const groups = useMemo(
    () =>
      normalizedSelectedParts.flatMap((partNumber) => partGroups[partNumber] ?? []),
    [normalizedSelectedParts, partGroups],
  );

  const answerKeyMap = useMemo(() => buildAnswerKeyMap(groups), [groups]);

  const questions = useMemo(
    () => buildFullTestQuestions(partGroups, normalizedSelectedParts),
    [normalizedSelectedParts, partGroups],
  );

  const steps = useMemo(
    () => buildFullTestSteps(partGroups, normalizedSelectedParts),
    [normalizedSelectedParts, partGroups],
  );

  const primaryPartNumber = normalizedSelectedParts[0] ?? 1;
  const practice = usePracticeSession({
    accessToken,
    answerKeyMap,
    clearSession,
    enabled: allPartsLoaded,
    partNumber: primaryPartNumber,
    selectedParts: normalizedSelectedParts,
    testId,
  });

  const storageKey = practice.sessionId
    ? getPracticeStorageKey(practice.sessionId)
    : null;

  useEffect(() => {
    if (!storageKey || initializedStorageKeyRef.current === storageKey) {
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
    await queryClient.invalidateQueries({
      queryKey: getPracticeStatsQueryKey(testId),
    });
  }, [queryClient, testId]);

  useRegisterPracticeExit(practice.sessionId ? handleExit : null, testLabel);

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

  if (isLoadingParts || practice.isStarting) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (partLoadError || practice.startError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {practice.startError ??
              getErrorMessage(partLoadError, "Cannot load this practice.")}
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
            This practice has no questions yet. Check that TOEIC data is imported.
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
        sessionId={practice.sessionId}
        step={currentStep}
        testId={testId}
      />
    </PracticeContinuousShell>
  );
}

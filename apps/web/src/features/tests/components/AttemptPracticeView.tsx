"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { syncTestAttemptProgress } from "@/features/tests/api/testsApi";
import { PracticeAttemptStepContent } from "@/features/tests/components/PracticeAttemptStepContent";
import { PracticeContinuousShell } from "@/features/tests/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import {
  getFullTestSession,
  useFullTestPracticeSessions,
} from "@/features/tests/hooks/useFullTestPracticeSessions";
import { useTestPartGroups } from "@/features/tests/hooks/useTestPartGroups";
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
} from "@/features/tests/lib/practiceQuestionGrid";
import { useRegisterPracticeExit } from "@/features/tests/providers/PracticeExitProvider";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type AttemptPracticeViewProps = {
  testId: number;
  testLabel: string;
  attemptId: string;
  selectedParts: number[];
  accessToken: string | null;
  clearSession: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AttemptPracticeView({
  testId,
  testLabel,
  attemptId,
  selectedParts,
  accessToken,
  clearSession,
}: AttemptPracticeViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);

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

  const questions = useMemo(
    () => buildFullTestQuestions(partGroups, normalizedSelectedParts),
    [normalizedSelectedParts, partGroups],
  );

  const steps = useMemo(
    () => buildFullTestSteps(partGroups, normalizedSelectedParts),
    [normalizedSelectedParts, partGroups],
  );

  const { sessions, isStarting, startError, allReady } =
    useFullTestPracticeSessions({
      accessToken,
      clearSession,
      testId,
      partGroups,
      selectedParts: normalizedSelectedParts,
      enabled: allPartsLoaded,
    });

  const [stepIndex, setStepIndex] = useState(() =>
    resolveInitialStepIndex(
      attemptId,
      steps,
      questions,
      normalizedSelectedParts,
    ),
  );

  const activeStepIndex =
    steps.length === 0 ? 0 : Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[activeStepIndex] ?? null;
  const practice = currentStep
    ? getFullTestSession(sessions, currentStep.partNumber)
    : null;

  const syncAttemptProgress = useCallback(
    async (finish = false) => {
      const parts = normalizedSelectedParts.map((partNumber) => {
        const session = getFullTestSession(sessions, partNumber);
        return {
          partNumber,
          correctCount: session.correctCount,
          wrongCount: session.wrongCount,
        };
      });

      const updatedAttempt = await runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          syncTestAttemptProgress(token, attemptId, { parts, finish }),
      });

      await queryClient.invalidateQueries({
        queryKey: ["test-attempt", attemptId],
      });

      return updatedAttempt;
    },
    [accessToken, attemptId, clearSession, normalizedSelectedParts, queryClient, sessions],
  );

  const goToStepIndex = useCallback(
    (nextIndex: number) => {
      if (steps.length === 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
      if (boundedIndex === activeStepIndex) {
        return;
      }

      setStepIndex(boundedIndex);
      writeFullTestIndex(attemptId, boundedIndex);
    },
    [activeStepIndex, attemptId, steps.length],
  );

  const handleExit = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncAttemptProgress(false);
    } finally {
      setIsSyncing(false);
    }

    router.push("/tests");
  }, [router, syncAttemptProgress]);

  const anySessionReady = Object.values(sessions).some(
    (session) => session.sessionId != null,
  );
  useRegisterPracticeExit(anySessionReady ? handleExit : null, testLabel);

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
        (questionId, partNumber) =>
          getQuestionGridResultFromAnswer(
            getFullTestSession(sessions, partNumber).getAnswer(questionId),
          ),
      ),
    [activeQuestionNumbers, normalizedSelectedParts, sessions, steps],
  );

  const isLastStep = activeStepIndex >= steps.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      isQuestionGridOpen={isQuestionGridOpen}
      nextAriaLabel="Next"
      nextDisabled={isLastStep || isSyncing}
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
      previousDisabled={activeStepIndex === 0 || isSyncing}
      questionGridSections={questionGridSections}
    />
  );

  if (isLoadingParts) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (partLoadError || startError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {startError ?? getErrorMessage(partLoadError, "Cannot load this test.")}
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
            This test has no questions yet. Check that TOEIC data is imported.
          </p>
        </Panel>
      </PageShell>
    );
  }

  if (isStarting || !allReady || !currentStep || !practice?.sessionId) {
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

"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { getTestPart, syncTestAttemptProgress } from "@/features/tests/api/testsApi";
import type { TestAttemptDetail, ToeicQuestionGroup } from "@/features/tests/api/types";
import { ListeningGroupPracticeContent } from "@/features/tests/components/ListeningGroupPracticeContent";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { PracticeQuestionScreen } from "@/features/tests/components/PracticeQuestionScreen";
import {
  getFullTestSession,
  useFullTestPracticeSessions,
} from "@/features/tests/hooks/useFullTestPracticeSessions";
import {
  buildFullTestQuestions,
  buildFullTestSteps,
  resolveInitialStepIndex,
} from "@/features/tests/lib/fullTestQuestions";
import { writeFullTestIndex } from "@/features/tests/lib/fullTestStorage";
import { getQuestionGridResultFromAnswer } from "@/features/tests/lib/practiceAnswers";
import { normalizeSelectedParts } from "@/features/tests/lib/toeicParts";
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

type FullTestPracticeViewProps = {
  testId: number;
  attemptId: string;
  attempt: TestAttemptDetail;
  selectedParts: number[];
  accessToken: string | null;
  clearSession: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function FullTestPracticeView({
  testId,
  attemptId,
  selectedParts,
  accessToken,
  clearSession,
}: FullTestPracticeViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const normalizedSelectedParts = useMemo(
    () => normalizeSelectedParts(selectedParts),
    [selectedParts],
  );

  const partQueries = useQueries({
    queries: normalizedSelectedParts.map((partNumber) => ({
      queryKey: ["test-part", testId, partNumber],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        runAuthenticatedRequest({
          accessToken,
          clearSession,
          request: (token) => getTestPart(token, testId, partNumber, { signal }),
        }),
      enabled: Boolean(accessToken),
    })),
  });

  const partGroups = useMemo(() => {
    const groups: Record<number, ToeicQuestionGroup[]> = {};

    for (let index = 0; index < normalizedSelectedParts.length; index += 1) {
      const partNumber = normalizedSelectedParts[index];
      if (partNumber != null && partQueries[index]?.data?.groups) {
        groups[partNumber] = partQueries[index].data!.groups;
      }
    }

    return groups;
  }, [normalizedSelectedParts, partQueries]);

  const questions = useMemo(
    () => buildFullTestQuestions(partGroups, normalizedSelectedParts),
    [normalizedSelectedParts, partGroups],
  );

  const steps = useMemo(
    () => buildFullTestSteps(partGroups, normalizedSelectedParts),
    [normalizedSelectedParts, partGroups],
  );

  const allPartsLoaded =
    normalizedSelectedParts.length > 0 &&
    partQueries.every((query) => query.data);
  const partLoadError = partQueries.find((query) => query.error)?.error;

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
  useRegisterPracticeExit(anySessionReady ? handleExit : null);

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
        const stepIndex = findStepIndexForQuestion(steps, questionNumber);
        if (stepIndex >= 0) {
          goToStepIndex(stepIndex);
        }
      }}
      previousDisabled={activeStepIndex === 0 || isSyncing}
      questionGridSections={questionGridSections}
    />
  );

  if (partQueries.some((query) => query.isLoading)) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading full test...</p>
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
    <PageShell fillViewport>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {currentStep.kind === "group" ? (
            <ListeningGroupPracticeContent
              accessToken={accessToken}
              clearSession={clearSession}
              groups={[currentStep.practiceGroup]}
              initialGroupIndex={0}
              key={`${currentStep.practiceGroup.group.id}-${practice.sessionId}`}
              navigation={null}
              partNumber={currentStep.partNumber}
              practice={practice}
              practiceMode="normal"
              testId={testId}
            />
          ) : (
            <PracticeQuestionScreen
              accessToken={accessToken}
              clearSession={clearSession}
              item={currentStep.item}
              key={`${currentStep.item.question.id}-${practice.sessionId}`}
              partNumber={currentStep.partNumber}
              practice={practice}
              testId={testId}
            />
          )}
        </div>
        <div className="shrink-0 border-t border-border p-4">{navigationBar}</div>
      </div>
    </PageShell>
  );
}

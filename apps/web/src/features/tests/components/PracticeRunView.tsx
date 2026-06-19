
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PracticeAttemptStepContent } from "@/features/tests/components/PracticeAttemptStepContent";
import { PracticeContinuousShell } from "@/features/tests/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import {
  getWrongQuestionsQueryKey,
  useWrongQuestionsForParts,
} from "@/features/tests/hooks/useWrongQuestions";
import { useTestPartGroups } from "@/features/tests/hooks/useTestPartGroups";
import { getPracticeStatsQueryKey } from "@/features/tests/hooks/usePracticeStats";
import type { PracticeMode, ToeicQuestionGroup } from "@/features/tests/api/types";
import { buildAnswerKeyMap } from "@/features/tests/lib/answerKeyMap";
import {
  buildFullTestQuestions,
  buildFullTestSteps,
  resolveInitialStepIndex,
} from "@/features/tests/lib/fullTestQuestions";
import { writeFullTestIndex } from "@/features/tests/lib/fullTestStorage";
import { getQuestionGridResultFromAnswer } from "@/features/tests/lib/practiceAnswers";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
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
  selectedParts: number[];
  accessToken: string | null;
  clearSession: () => void;
  practiceMode?: PracticeMode;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getPracticeStorageKey(sessionId: string) {
  return `practice-${sessionId}`;
}

function filterPartGroupsForWrongReview(
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>,
  selectedParts: number[],
  wrongQuestionIds: number[] | null,
) {
  if (wrongQuestionIds == null) {
    return {};
  }

  const wrongIds = new Set(wrongQuestionIds);
  const filtered: Record<number, ToeicQuestionGroup[]> = {};

  for (const partNumber of selectedParts) {
    const groups = partGroups[partNumber] ?? [];
    const partConfig = getPartPracticeConfig(partNumber);

    filtered[partNumber] = groups.flatMap((group) => {
      const wrongQuestions = group.questions.filter((question) =>
        wrongIds.has(question.id),
      );

      if (wrongQuestions.length === 0) {
        return [];
      }

      if (partConfig.navigationMode === "per-group") {
        return [group];
      }

      return [{ ...group, questions: wrongQuestions }];
    });
  }

  return filtered;
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

  const isWrongMode = practiceMode === "review_wrong";
  const {
    wrongQuestions,
    isLoadingWrongQuestions,
    wrongQuestionsError,
  } = useWrongQuestionsForParts({
    accessToken,
    clearSession,
    enabled: allPartsLoaded && isWrongMode,
    selectedParts: normalizedSelectedParts,
    testId,
  });

  const wrongQuestionIds = useMemo(
    () => wrongQuestions.map((question) => question.toeicQuestionId),
    [wrongQuestions],
  );

  const rawGroups = useMemo(
    () =>
      normalizedSelectedParts.flatMap((partNumber) => partGroups[partNumber] ?? []),
    [normalizedSelectedParts, partGroups],
  );
  const rawAnswerKeyMap = useMemo(() => buildAnswerKeyMap(rawGroups), [rawGroups]);
  const primaryPartNumber = normalizedSelectedParts[0] ?? 1;
  const practice = usePracticeSession({
    accessToken,
    answerKeyMap: rawAnswerKeyMap,
    clearSession,
    enabled: allPartsLoaded && (!isWrongMode || !isLoadingWrongQuestions),
    mode: practiceMode,
    partNumber: primaryPartNumber,
    selectedParts: normalizedSelectedParts,
    testId,
  });

  const activeWrongQuestionIds = useMemo(() => {
    if (!isWrongMode || !practice.sessionId || isLoadingWrongQuestions) {
      return null;
    }

    return wrongQuestionIds;
    // Freeze the review pool when a session starts; correct answers must not shrink it mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wrongQuestionIds intentionally omitted
  }, [isLoadingWrongQuestions, isWrongMode, practice.sessionId]);

  const effectivePartGroups = useMemo(() => {
    if (!isWrongMode) {
      return partGroups;
    }

    return filterPartGroupsForWrongReview(
      partGroups,
      normalizedSelectedParts,
      activeWrongQuestionIds,
    );
  }, [activeWrongQuestionIds, isWrongMode, normalizedSelectedParts, partGroups]);


  const questions = useMemo(
    () => buildFullTestQuestions(effectivePartGroups, normalizedSelectedParts),
    [effectivePartGroups, normalizedSelectedParts],
  );

  const steps = useMemo(
    () => buildFullTestSteps(effectivePartGroups, normalizedSelectedParts),
    [effectivePartGroups, normalizedSelectedParts],
  );

  const hasReviewGroupSteps = steps.some((step) => step.kind === "group");
  const normalPractice = usePracticeSession({
    accessToken,
    answerKeyMap: rawAnswerKeyMap,
    clearSession,
    enabled:
      allPartsLoaded &&
      isWrongMode &&
      hasReviewGroupSteps &&
      Boolean(practice.sessionId),
    mode: "practice",
    partNumber: primaryPartNumber,
    selectedParts: normalizedSelectedParts,
    testId,
  });

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

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getPracticeStatsQueryKey(testId),
      }),
      ...normalizedSelectedParts.map((partNumber) =>
        queryClient.invalidateQueries({
          queryKey: getWrongQuestionsQueryKey(testId, partNumber),
        }),
      ),
    ]);
  }, [isWrongMode, normalizedSelectedParts, practice, queryClient, testId]);

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
    isLoadingParts ||
    practice.isStarting ||
    (isWrongMode && isLoadingWrongQuestions) ||
    (isWrongMode && practice.sessionId != null && activeWrongQuestionIds == null) ||
    (isWrongMode && hasReviewGroupSteps && normalPractice.isStarting)
  ) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (partLoadError || practice.startError || wrongQuestionsError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {practice.startError ??
              wrongQuestionsError ??
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
        normalPractice={isWrongMode ? normalPractice : undefined}
        practice={practice}
        practiceMode={practiceMode}
        sessionId={practice.sessionId}
        step={currentStep}
        testId={testId}
      />
    </PracticeContinuousShell>
  );
}

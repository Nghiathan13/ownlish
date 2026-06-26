"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildPartPracticeTestIdMap,
  PartPracticeStepContent,
} from "@/features/tests/run/components/PartPracticeStepContent";
import { PracticeContinuousShell } from "@/features/tests/run/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import { TestRunLoadingSkeleton } from "@/features/tests/run/components/TestRunLoadingSkeleton";
import { usePartPracticeSession } from "@/features/tests/run/hooks/usePartPracticeSession";
import type { PracticeMode } from "@/entities/toeic/api/types";
import {
  buildAggregatePracticeRunQuestions,
  buildAggregatePracticeRunSteps,
  resolveInitialStepIndex,
} from "@/features/tests/run/lib/practiceRunSteps";
import { writePracticeRunIndex } from "@/features/tests/run/lib/practiceRunStorage";
import {
  getQuestionGridResultFromAnswer,
  isQuestionGridSelected,
} from "@/features/tests/run/lib/practiceAnswers";
import {
  buildPracticeRunGridSections,
  findStepIndexForQuestionId,
  getActiveQuestionIdsForStep,
  getAggregateQuestionGridDisplayNumber,
} from "@/features/tests/run/lib/practiceQuestionGrid";
import { getSessionQuestionNumber } from "@/features/tests/run/lib/sessionQuestionPosition";
import { useRegisterPracticeQuestionNav } from "@/features/tests/run/hooks/useRegisterPracticeQuestionNav";
import { useRegisterPracticeExit } from "@/features/tests/run/providers/PracticeExitProvider";
import { getTestsOverviewPath } from "@/features/tests/shared/lib/partPracticePaths";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PartPracticeRunViewProps = {
  sessionId: string;
  practiceMode?: PracticeMode;
};

function getPartPracticeStorageKey(sessionId: string) {
  return `part-practice-${sessionId}`;
}

export function PartPracticeRunView({
  sessionId,
  practiceMode = "practice",
}: PartPracticeRunViewProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const initializedStorageKeyRef = useRef<string | null>(null);
  const isWrongMode = practiceMode === "review_wrong";
  const practice = usePartPracticeSession({
    enabled: true,
    mode: practiceMode,
    sessionId,
  });
  const partNumber = practice.partNumber;
  const practiceOverviewPath = getTestsOverviewPath({
    tab: "practice",
    part: partNumber > 0 ? partNumber : undefined,
  });
  const selectedParts = useMemo(
    () => (partNumber > 0 ? [partNumber] : []),
    [partNumber],
  );

  const testIdByGroupId = useMemo(
    () => buildPartPracticeTestIdMap(practice.groups),
    [practice.groups],
  );

  const questions = useMemo(
    () =>
      partNumber > 0
        ? buildAggregatePracticeRunQuestions(partNumber, practice.groups)
        : [],
    [partNumber, practice.groups],
  );

  const steps = useMemo(
    () =>
      partNumber > 0
        ? buildAggregatePracticeRunSteps(partNumber, practice.groups)
        : [],
    [partNumber, practice.groups],
  );

  const storageKey = practice.sessionId
    ? getPartPracticeStorageKey(practice.sessionId)
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
        selectedParts,
      ),
    );
  }, [questions, selectedParts, steps, storageKey]);

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
      writePracticeRunIndex(storageKey, boundedIndex);
    },
    [activeStepIndex, steps.length, storageKey],
  );

  useRegisterPracticeExit(
    practice.sessionId ? () => undefined : null,
    partNumber > 0 ? `Part ${partNumber}` : null,
    practiceOverviewPath,
  );

  const activeQuestionIds = useMemo(
    () => getActiveQuestionIdsForStep(currentStep),
    [currentStep],
  );

  const questionGridSections = useMemo(
    () =>
      buildPracticeRunGridSections(
        steps,
        selectedParts,
        activeQuestionIds,
        (questionId) => getQuestionGridResultFromAnswer(practice.getAnswer(questionId)),
        (questionId) => isQuestionGridSelected(practice.getAnswer(questionId)),
        {
          resolveDisplayLabel: getAggregateQuestionGridDisplayNumber,
        },
      ),
    [activeQuestionIds, practice, selectedParts, steps],
  );

  const visibleQuestionGroups = useMemo(
    () =>
      steps.map((step) =>
        step.kind === "group"
          ? { questions: step.practiceGroup.questions }
          : { questions: [step.item.question] },
      ),
    [steps],
  );
  const totalQuestions = practice.totalQuestions;
  const currentStepQuestionId = currentStep
    ? currentStep.kind === "group"
      ? currentStep.practiceGroup.questions[0]?.id
      : currentStep.item.question.id
    : null;
  const currentQuestionNumber = getSessionQuestionNumber(
    visibleQuestionGroups,
    currentStepQuestionId,
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
      onQuestionGridSelect={(questionId) => {
        const stepIndexForQuestion = findStepIndexForQuestionId(steps, questionId);
        if (stepIndexForQuestion >= 0) {
          goToStepIndex(stepIndexForQuestion);
        }
      }}
      previousDisabled={activeStepIndex === 0}
      questionGridSections={questionGridSections}
    />
  );

  if (practice.isStarting) {
    return <TestRunLoadingSkeleton variant="part_practice" />;
  }

  if (practice.startError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">{practice.startError}</p>
          <div className="mt-4">
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => router.push(practiceOverviewPath)}
              type="button"
            >
              Back to practice
            </button>
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
              ? "No wrong questions left to review for this part."
              : "This part has no questions yet. Check that TOEIC data is imported."}
          </p>
          <div className="mt-4">
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => router.push(practiceOverviewPath)}
              type="button"
            >
              Back to practice
            </button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (!currentStep || !practice.sessionId || partNumber <= 0) {
    return <TestRunLoadingSkeleton variant="part_practice" />;
  }

  return (
    <PracticeContinuousShell navigation={navigationBar}>
      <PartPracticeStepContent
        practice={practice}
        sessionId={practice.sessionId}
        step={currentStep}
        testIdByGroupId={testIdByGroupId}
      />
    </PracticeContinuousShell>
  );
}

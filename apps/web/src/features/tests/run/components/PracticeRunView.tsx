
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PracticeStepContent } from "@/features/tests/run/components/PracticeStepContent";
import { PracticeContinuousShell } from "@/features/tests/run/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import {
  TestRunLoadingSkeleton,
  type TestRunLoadingVariant,
} from "@/features/tests/run/components/TestRunLoadingSkeleton";
import { usePracticeSession } from "@/features/tests/run/model/practice/usePracticeSession";
import type { PracticeMode, ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import {
  buildPracticeRunQuestions,
  buildPracticeRunSteps,
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
} from "@/features/tests/run/lib/practiceQuestionGrid";
import {
  getSessionQuestionNumber,
} from "@/features/tests/run/lib/sessionQuestionPosition";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import { useRegisterImmersiveQuestionNav } from "@/features/shell/hooks/useRegisterImmersiveQuestionNav";
import { useRegisterImmersiveExit } from "@/features/shell/providers/ImmersiveToolbarProvider";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPathFromYearValue,
} from "@/features/tests/shared/constants/toeicYears";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PracticeRunViewProps = {
  sessionId: string;
  selectedParts: number[];
  practiceMode?: PracticeMode;
};

function getPracticeStorageKey(sessionId: string) {
  return `practice-${sessionId}`;
}

function getPracticeRunLoadingVariant(
  practiceMode: PracticeMode,
): TestRunLoadingVariant {
  return practiceMode === "review_wrong" ? "review_wrong" : "practice";
}

export function PracticeRunView({
  sessionId,
  selectedParts,
  practiceMode = "practice",
}: PracticeRunViewProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const initializedStorageKeyRef = useRef<string | null>(null);
  const normalizedSelectedParts = useMemo(
    () => normalizeSelectedParts(selectedParts),
    [selectedParts],
  );
  const isWrongMode = practiceMode === "review_wrong";
  const practice = usePracticeSession({
    enabled: normalizedSelectedParts.length > 0,
    mode: practiceMode,
    sessionId,
    selectedParts: normalizedSelectedParts,
  });
  const testsListPath = getTestsListPathFromYearValue(
    practice.year ?? DEFAULT_TOEIC_YEAR,
  );
  const sessionSelectedParts =
    practice.partNumbers.length > 0
      ? practice.partNumbers
      : normalizedSelectedParts;

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
    () => buildPracticeRunQuestions(partGroups, sessionSelectedParts),
    [partGroups, sessionSelectedParts],
  );

  const steps = useMemo(
    () => buildPracticeRunSteps(partGroups, sessionSelectedParts),
    [partGroups, sessionSelectedParts],
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
        sessionSelectedParts,
      ),
    );
  }, [questions, sessionSelectedParts, steps, storageKey]);

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

  useRegisterImmersiveExit(
    practice.sessionId ? () => undefined : null,
    practice.testNumber != null
      ? `${practice.series?.match(/[A-Za-z]+/)?.[0]?.toUpperCase() ?? "TOEIC"} ${practice.year ?? ""} · Test ${practice.testNumber}`
      : null,
    testsListPath,
    { showBilingualAction: true },
  );

  const activeQuestionIds = useMemo(
    () => getActiveQuestionIdsForStep(currentStep),
    [currentStep],
  );

  const questionGridSections = useMemo(
    () =>
      buildPracticeRunGridSections(
        steps,
        sessionSelectedParts,
        activeQuestionIds,
        (questionId) => getQuestionGridResultFromAnswer(practice.getAnswer(questionId)),
        (questionId) => isQuestionGridSelected(practice.getAnswer(questionId)),
      ),
    [activeQuestionIds, practice, sessionSelectedParts, steps],
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

  useRegisterImmersiveQuestionNav({
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
    return (
      <TestRunLoadingSkeleton variant={getPracticeRunLoadingVariant(practiceMode)} />
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
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => router.push(testsListPath)}
              type="button"
            >
              Back to tests
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
              ? "No wrong questions left to review for the selected parts."
              : "This practice has no questions yet. Check that TOEIC data is imported."}
          </p>
        </Panel>
      </PageShell>
    );
  }

  if (!currentStep || !practice.sessionId) {
    return (
      <TestRunLoadingSkeleton variant={getPracticeRunLoadingVariant(practiceMode)} />
    );
  }

  return (
    <PracticeContinuousShell navigation={navigationBar}>
      <PracticeStepContent
        practice={practice}
        sessionId={practice.sessionId}
        step={currentStep}
      />
    </PracticeContinuousShell>
  );
}

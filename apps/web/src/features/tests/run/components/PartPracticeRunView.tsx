"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PartPracticeStepContent } from "@/features/tests/run/components/PartPracticeStepContent";
import { PracticeContinuousShell } from "@/features/tests/run/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import { TestRunLoadingSkeleton } from "@/features/tests/run/components/TestRunLoadingSkeleton";
import { usePartPracticeSession } from "@/features/tests/run/model/practice/usePartPracticeSession";
import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import {
  buildAggregatePracticeRunSteps,
  type PracticeRunStep,
} from "@/features/tests/run/lib/practiceRunSteps";
import {
  getPartPracticePositionStorageKey,
  readPartPracticeGroupKey,
  writePartPracticeGroupKey,
} from "@/features/tests/shared/model/partPracticePosition";
import { preloadMedia } from "@/shared/lib/preloadMedia";
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
import { useRegisterImmersiveExit } from "@/features/shell/providers/ImmersiveToolbarProvider";
import { getTestsOverviewPath } from "@/features/tests/shared/lib/partPracticePaths";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type PartPracticeRunViewProps = {
  sessionId: string;
  practiceMode?: PracticeMode;
  partNumber: number | null;
};

function getStepGroup(step: PracticeRunStep) {
  return step.kind === "group" ? step.practiceGroup.group : step.item.group;
}

export function PartPracticeRunView({
  sessionId,
  practiceMode = "practice",
  partNumber: routePartNumber,
}: PartPracticeRunViewProps) {
  const t = useT();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const initializedStorageKeyRef = useRef<string | null>(null);
  const isWrongMode = practiceMode === "review_wrong";
  const initialGroupKey = useMemo(
    () =>
      routePartNumber
        ? readPartPracticeGroupKey(routePartNumber, practiceMode)
        : null,
    [practiceMode, routePartNumber],
  );
  const practice = usePartPracticeSession({
    enabled: true,
    initialGroupKey,
    mode: practiceMode,
    partNumber: routePartNumber,
    sessionId,
  });
  const partNumber = practice.partNumber;
  const practiceOverviewPath = getTestsOverviewPath({
    tab: "part_practice",
    part: partNumber > 0 ? partNumber : undefined,
  });
  const selectedParts = useMemo(
    () => (partNumber > 0 ? [partNumber] : []),
    [partNumber],
  );

  const steps = useMemo(
    () =>
      partNumber > 0
        ? buildAggregatePracticeRunSteps(partNumber, practice.groups)
        : [],
    [partNumber, practice.groups],
  );

  const storageKey = partNumber > 0
    ? getPartPracticePositionStorageKey(partNumber, practiceMode)
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
    const storedGroupKey = initialGroupKey
      ?? readPartPracticeGroupKey(partNumber, practiceMode);
    const initialIndex = steps.findIndex(
      (step) =>
        practice.groupKeyById.get(getStepGroup(step).id) === storedGroupKey,
    );
    const resolvedIndex = initialIndex >= 0 ? initialIndex : 0;
    const group = getStepGroup(steps[resolvedIndex]);
    const groupKey = practice.groupKeyById.get(group.id);

    setStepIndex(resolvedIndex);
    if (groupKey) {
      writePartPracticeGroupKey(partNumber, practiceMode, groupKey);
    }
    preloadMedia(group);
  }, [
    initialGroupKey,
    partNumber,
    practice.groupKeyById,
    practiceMode,
    steps,
    storageKey,
  ]);

  const activeStepIndex =
    steps.length === 0 ? 0 : Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[activeStepIndex] ?? null;

  const goToStepIndex = useCallback(
    (nextIndex: number) => {
      if (!storageKey || steps.length === 0 || partNumber <= 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
      if (boundedIndex === activeStepIndex) {
        return;
      }

      setStepIndex(boundedIndex);
      const group = getStepGroup(steps[boundedIndex]);
      const groupKey = practice.groupKeyById.get(group.id);
      if (groupKey) {
        writePartPracticeGroupKey(partNumber, practiceMode, groupKey);
      }
      preloadMedia(group);
    },
    [
      activeStepIndex,
      partNumber,
      practice.groupKeyById,
      practiceMode,
      steps,
      storageKey,
    ],
  );

  useRegisterImmersiveExit(
    practice.sessionId ? () => undefined : null,
    partNumber > 0
      ? formatMessage(t("tests.partNumber"), { number: partNumber })
      : null,
    practiceOverviewPath,
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

  const isLastStep = activeStepIndex >= steps.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      currentQuestionNumber={currentQuestionNumber}
      isQuestionGridOpen={isQuestionGridOpen}
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
      totalQuestions={totalQuestions}
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
              {t("tests.backToPractice")}
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
              ? t("tests.noWrongQuestionsForPart")
              : t("tests.partNoQuestions")}
          </p>
          <div className="mt-4">
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => router.push(practiceOverviewPath)}
              type="button"
            >
              {t("tests.backToPractice")}
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
      />
    </PracticeContinuousShell>
  );
}

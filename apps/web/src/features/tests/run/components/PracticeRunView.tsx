
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
import type { PracticeMode, ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";
import {
  buildPracticeRunSteps,
} from "@/features/tests/run/lib/practiceRunSteps";
import {
  readTestPracticeGroupKey,
  writeTestPracticeGroupKey,
} from "@/features/tests/shared/model/testPracticePosition";
import { resolveInitialTestPracticeStepIndex } from "@/features/tests/run/model/practice/testPracticeStepPosition";
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
import { useRegisterImmersiveExit } from "@/features/shell/providers/ImmersiveToolbarProvider";
import {
  LEARNING_ACTIVITY_TYPES,
} from "@/entities/learning-activity";
import { useLearningActivityTracker } from "@/features/learning-activity/model/useLearningActivityTracker";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPathFromYearValue,
} from "@/features/tests/shared/constants/toeicYears";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type PracticeRunViewProps = {
  sessionId: string;
  selectedParts: number[];
  practiceMode?: PracticeMode;
  testKey: string | null;
};

function getPracticeRunLoadingVariant(
  practiceMode: PracticeMode,
): TestRunLoadingVariant {
  return practiceMode === "review_wrong" ? "review_wrong" : "practice";
}

export function PracticeRunView({
  sessionId,
  selectedParts,
  practiceMode = "practice",
  testKey,
}: PracticeRunViewProps) {
  const t = useT();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const initializedStorageKeyRef = useRef<string | null>(null);
  const normalizedSelectedParts = useMemo(
    () => normalizeSelectedParts(selectedParts),
    [selectedParts],
  );
  const isWrongMode = practiceMode === "review_wrong";
  const initialGroupKey = useMemo(
    () => readTestPracticeGroupKey(testKey, practiceMode, normalizedSelectedParts),
    [normalizedSelectedParts, practiceMode, testKey],
  );
  const practice = usePracticeSession({
    enabled: normalizedSelectedParts.length > 0,
    initialGroupKey,
    mode: practiceMode,
    sessionId,
    selectedParts: normalizedSelectedParts,
    testKey,
  });
  const testsListPath = getTestsListPathFromYearValue(
    practice.year ?? DEFAULT_TOEIC_YEAR,
  );
  const sessionSelectedParts =
    practice.partNumbers.length > 0
      ? practice.partNumbers
      : normalizedSelectedParts;
  const storageTestKey = testKey ?? practice.testKey;
  const positionScopeKey = `${storageTestKey ?? ""}:${practiceMode}:${normalizedSelectedParts.join(",")}`;

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

  const steps = useMemo(
    () => buildPracticeRunSteps(partGroups, sessionSelectedParts),
    [partGroups, sessionSelectedParts],
  );

  useEffect(() => {
    if (
      !practice.sessionId ||
      steps.length === 0 ||
      initializedStorageKeyRef.current === positionScopeKey
    ) {
      return;
    }

    initializedStorageKeyRef.current = positionScopeKey;
    const initialStepIndex = resolveInitialTestPracticeStepIndex(
      steps,
      practice.groupKeyById,
      initialGroupKey,
      sessionSelectedParts,
    );
    const step = steps[initialStepIndex];
    const group = step?.kind === "group" ? step.practiceGroup.group : step?.item.group;
    const groupKey = group ? practice.groupKeyById.get(group.id) : null;

    setStepIndex(initialStepIndex);
    if (groupKey) {
      writeTestPracticeGroupKey(
        storageTestKey,
        practiceMode,
        normalizedSelectedParts,
        groupKey,
      );
    }
  }, [
    initialGroupKey,
    normalizedSelectedParts,
    positionScopeKey,
    practice.groupKeyById,
    practiceMode,
    sessionSelectedParts,
    steps,
    storageTestKey,
    practice.sessionId,
  ]);

  const activeStepIndex =
    steps.length === 0 ? 0 : Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[activeStepIndex] ?? null;

  const goToStepIndex = useCallback(
    (nextIndex: number) => {
      if (!practice.sessionId || steps.length === 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
      if (boundedIndex === activeStepIndex) {
        return;
      }

      setStepIndex(boundedIndex);
      const step = steps[boundedIndex];
      const group = step?.kind === "group" ? step.practiceGroup.group : step?.item.group;
      const groupKey = group ? practice.groupKeyById.get(group.id) : null;
      if (groupKey) {
        writeTestPracticeGroupKey(
          storageTestKey,
          practiceMode,
          normalizedSelectedParts,
          groupKey,
        );
      }
    },
    [
      activeStepIndex,
      normalizedSelectedParts,
      practice.groupKeyById,
      practiceMode,
      steps,
      storageTestKey,
      practice.sessionId,
    ],
  );

  useRegisterImmersiveExit(
    practice.sessionId ? () => undefined : null,
    practice.testNumber != null
      ? formatMessage(t("tests.testSessionTitle"), {
          series:
            practice.series?.match(/[A-Za-z]+/)?.[0]?.toUpperCase() ?? "TOEIC",
          year: practice.year ?? "",
          testNumber: practice.testNumber,
        })
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

  useLearningActivityTracker({
    activityType:
      practiceMode === "review_wrong"
        ? LEARNING_ACTIVITY_TYPES.TEST_REVIEW_WRONG
        : LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
    enabled:
      !practice.isStarting &&
      !practice.startError &&
      Boolean(practice.sessionId) &&
      steps.length > 0,
  });
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
              {t("tests.backToTests")}
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
              ? t("tests.noWrongQuestionsForParts")
              : t("tests.practiceNoQuestions")}
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

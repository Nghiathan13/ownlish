"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { getTestPart, syncTestAttemptProgress } from "@/features/tests/api/testsApi";
import type { TestAttemptDetail, ToeicQuestionGroup } from "@/features/tests/api/types";
import { ListeningGroupPracticeContent } from "@/features/tests/components/ListeningGroupPracticeContent";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { PracticeQuestionPrompt } from "@/features/tests/components/PracticeQuestionPrompt";
import { PracticeSplitPlainLayout } from "@/features/tests/components/PracticeSplitPlainLayout";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import {
  getFullTestSession,
  useFullTestPracticeSessions,
  type FullTestPracticeSession,
} from "@/features/tests/hooks/useFullTestPracticeSessions";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import {
  buildFullTestQuestions,
  buildFullTestSteps,
  resolveInitialStepIndex,
  type FullTestQuestionItem,
} from "@/features/tests/lib/fullTestQuestions";
import { writeFullTestIndex } from "@/features/tests/lib/fullTestStorage";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
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

type FullTestQuestionScreenProps = {
  testId: number;
  item: FullTestQuestionItem;
  practice: FullTestPracticeSession;
  accessToken: string | null;
  clearSession: () => void;
  navigation: React.ReactNode;
};

function FullTestQuestionScreen({
  testId,
  item,
  practice,
  accessToken,
  clearSession,
  navigation,
}: FullTestQuestionScreenProps) {
  const partNumber = item.partNumber;
  const partConfig = getPartPracticeConfig(partNumber);
  const question = item.question;

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: item.group,
    accessToken,
    clearSession,
  });

  const currentAnswer = practice.getAnswer(question.id);
  const isAnswered = isPracticeAnswerGraded(currentAnswer);

  const handleSelect = (key: "A" | "B" | "C" | "D") => {
    if (isAnswered) {
      return;
    }

    practice.selectAnswer(question.id, key);
  };

  const leftPanel =
    partConfig.leftPanel !== "none" ? (
      <PracticeLeftPanel
        audioUrl={signedMedia.audioUrl}
        group={item.group}
        imageUrl={signedMedia.imageUrl}
        mediaError={signedMedia.mediaError}
        onMediaError={signedMedia.handleMediaError}
        partConfig={partConfig}
        plain
        questionNumber={question.questionNumber}
        questionText={question.question}
        showContext
        showContextTranslation={isAnswered}
      />
    ) : null;

  const syncFailureBanner = practice.isQuestionSyncFailed(question.id) ? (
    <p className="text-base text-red-600">
      Could not save this answer.{" "}
      <button
        className="underline"
        onClick={() => practice.retrySync(question.id)}
        type="button"
      >
        Retry
      </button>
    </p>
  ) : null;

  return (
    <PracticeSplitPlainLayout
      left={leftPanel}
      navigation={navigation}
      right={
        <div className="flex flex-col gap-4">
          <PracticeQuestionPrompt
            questionNumber={question.questionNumber}
            questionText={
              partConfig.showQuestionInRightPanel ? question.question : null
            }
          />
          <QuestionOptions
            answerKey={currentAnswer?.answerKey ?? null}
            isLocked={isAnswered}
            isSubmitting={practice.isQuestionPending(question.id)}
            onSelect={handleSelect}
            optionCount={question.optionCount}
            options={question.options}
            selectedKey={currentAnswer?.selectedKey ?? null}
            showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
          />
          <QuestionTranslationPanel
            optionCount={question.optionCount}
            options={question.options}
            questionVi={question.questionVi}
            variant={partConfig.translationVariant}
            visible={isAnswered}
          />
          {syncFailureBanner}
        </div>
      }
    />
  );
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
      ),
    [activeQuestionNumbers, normalizedSelectedParts, steps],
  );

  const isLastStep = activeStepIndex >= steps.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      nextAriaLabel="Next"
      nextDisabled={isLastStep || isSyncing}
      onNext={() => {
        goToStepIndex(activeStepIndex + 1);
      }}
      onPrevious={() => {
        goToStepIndex(activeStepIndex - 1);
      }}
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
      {currentStep.kind === "group" ? (
        <ListeningGroupPracticeContent
          accessToken={accessToken}
          clearSession={clearSession}
          groups={[currentStep.practiceGroup]}
          initialGroupIndex={0}
          key={`${currentStep.practiceGroup.group.id}-${practice.sessionId}`}
          navigation={navigationBar}
          onFinish={() => {}}
          partNumber={currentStep.partNumber}
          practice={practice}
          practiceMode="normal"
          testId={testId}
        />
      ) : (
        <FullTestQuestionScreen
          accessToken={accessToken}
          clearSession={clearSession}
          item={currentStep.item}
          key={`${currentStep.item.question.id}-${practice.sessionId}`}
          navigation={navigationBar}
          practice={practice}
          testId={testId}
        />
      )}
    </PageShell>
  );
}

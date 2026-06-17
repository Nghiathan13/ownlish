"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { getTestPart, completeTestAttemptPart } from "@/features/tests/api/testsApi";
import type { TestAttemptDetail, ToeicQuestionGroup } from "@/features/tests/api/types";
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
  findGroupForQuestion,
  type FullTestQuestionItem,
} from "@/features/tests/lib/fullTestQuestions";
import {
  readFullTestIndex,
  writeFullTestIndex,
} from "@/features/tests/lib/fullTestStorage";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
import { useRegisterPracticeExit } from "@/features/tests/providers/PracticeExitProvider";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type OptionKey = "A" | "B" | "C" | "D";

type FullTestPracticeViewProps = {
  testId: number;
  attemptId: string;
  attempt: TestAttemptDetail;
  accessToken: string | null;
  clearSession: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function resolveInitialGlobalIndex(
  attemptId: string,
  questions: FullTestQuestionItem[],
  currentPartNumber: number,
) {
  if (questions.length === 0) {
    return 0;
  }

  const savedIndex = readFullTestIndex(attemptId);
  if (savedIndex > 0 && savedIndex < questions.length) {
    return savedIndex;
  }

  const partStartIndex = questions.findIndex(
    (item) => item.partNumber === currentPartNumber,
  );

  return partStartIndex >= 0 ? partStartIndex : 0;
}

function getCompletedPartNumbers(attempt: TestAttemptDetail) {
  return new Set(
    attempt.parts
      .filter((part) => part.completedAt != null)
      .map((part) => part.partNumber),
  );
}

type FullTestQuestionScreenProps = {
  testId: number;
  item: FullTestQuestionItem;
  practice: FullTestPracticeSession;
  accessToken: string | null;
  clearSession: () => void;
  groupQuestions: FullTestQuestionItem["group"]["questions"];
  navigation: React.ReactNode;
};

function FullTestQuestionScreen({
  testId,
  item,
  practice,
  accessToken,
  clearSession,
  groupQuestions,
  navigation,
}: FullTestQuestionScreenProps) {
  const partNumber = item.partNumber;
  const partConfig = getPartPracticeConfig(partNumber);
  const question = item.question;
  const usesDeferredGroupGrading = partConfig.hideContextUntilGroupComplete;
  const [localSelections, setLocalSelections] = useState<Record<number, OptionKey>>(
    {},
  );

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: item.group,
    accessToken,
    clearSession,
  });

  const currentAnswer = practice.getAnswer(question.id);
  const allGroupGraded = groupQuestions.every((groupQuestion) =>
    isPracticeAnswerGraded(practice.getAnswer(groupQuestion.id)),
  );
  const allQuestionsSelected = groupQuestions.every((groupQuestion) => {
    const selectedKey =
      localSelections[groupQuestion.id] ??
      practice.getAnswer(groupQuestion.id)?.selectedKey;
    return selectedKey != null;
  });
  const showGroupReveal =
    !usesDeferredGroupGrading || allQuestionsSelected || allGroupGraded;
  const isPartialGroupPhase = usesDeferredGroupGrading && !showGroupReveal;
  const isAnswered = usesDeferredGroupGrading
    ? showGroupReveal && isPracticeAnswerGraded(currentAnswer)
    : isPracticeAnswerGraded(currentAnswer);

  let selectedKey: OptionKey | null;
  let answerKey: OptionKey | null;
  let isLocked: boolean;
  let showResult: boolean;

  if (usesDeferredGroupGrading) {
    selectedKey = localSelections[question.id] ?? currentAnswer?.selectedKey ?? null;
    if (showGroupReveal) {
      answerKey = currentAnswer?.answerKey ?? question.answerKey ?? null;
      isLocked = true;
      showResult = true;
    } else {
      answerKey = null;
      isLocked = false;
      showResult = false;
    }
  } else {
    selectedKey = currentAnswer?.selectedKey ?? null;
    answerKey = isPracticeAnswerGraded(currentAnswer)
      ? (currentAnswer?.answerKey ?? question.answerKey ?? null)
      : null;
    isLocked = isPracticeAnswerGraded(currentAnswer);
    showResult = isPracticeAnswerGraded(currentAnswer);
  }

  const handleSelect = (key: OptionKey) => {
    if (usesDeferredGroupGrading) {
      if (showGroupReveal) {
        return;
      }

      const existing = practice.getAnswer(question.id);
      const currentSelectedKey =
        localSelections[question.id] ?? existing?.selectedKey;
      if (currentSelectedKey === key) {
        return;
      }

      const nextSelections = {
        ...localSelections,
        [question.id]: key,
      };
      setLocalSelections(nextSelections);

      const allSelected = groupQuestions.every((groupQuestion) => {
        const selected =
          groupQuestion.id === question.id
            ? key
            : (nextSelections[groupQuestion.id] ??
              practice.getAnswer(groupQuestion.id)?.selectedKey);
        return selected != null;
      });

      if (allSelected) {
        const entries = groupQuestions.map((groupQuestion) => ({
          toeicQuestionId: groupQuestion.id,
          selectedKey: (groupQuestion.id === question.id
            ? key
            : (nextSelections[groupQuestion.id] ??
              practice.getAnswer(groupQuestion.id)?.selectedKey))!,
        }));
        practice.gradeGroupLocally(entries);
        setLocalSelections({});
        void practice.syncAnswerToServer(question.id, key, {
          replace: Boolean(existing?.selectedKey),
        });
        return;
      }

      practice.selectAnswer(question.id, key, {
        deferGrade: true,
        replace: Boolean(existing?.selectedKey),
        selectionOnly: true,
      });
      return;
    }

    if (isPracticeAnswerGraded(currentAnswer)) {
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
        showContext={
          partConfig.leftPanel !== "listening-group" ||
          !partConfig.hideContextUntilGroupComplete ||
          isAnswered ||
          showGroupReveal
        }
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

  const showGroupPassageTranslation =
    showGroupReveal &&
    item.group.contentVi?.trim() &&
    (partConfig.leftPanel === "passage" ||
      partConfig.translationVariant === "content-options" ||
      partConfig.translationVariant === "content-question-options");

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
            answerKey={answerKey}
            isLocked={isLocked}
            isSubmitting={
              isPartialGroupPhase
                ? false
                : practice.isQuestionPending(question.id)
            }
            onSelect={handleSelect}
            optionCount={question.optionCount}
            options={question.options}
            selectedKey={selectedKey}
            showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
            showResult={showResult}
          />
          <QuestionTranslationPanel
            optionCount={question.optionCount}
            options={question.options}
            questionVi={question.questionVi}
            variant={partConfig.translationVariant}
            visible={usesDeferredGroupGrading ? showGroupReveal : isAnswered}
          />
          {showGroupPassageTranslation ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 text-base text-foreground select-text">
              <p className="font-semibold">Translations</p>
              <p className="whitespace-pre-wrap">{item.group.contentVi}</p>
            </div>
          ) : null}
          {syncFailureBanner}
        </div>
      }
    />
  );
}

export function FullTestPracticeView({
  testId,
  attemptId,
  attempt,
  accessToken,
  clearSession,
}: FullTestPracticeViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const completedPartsRef = useRef(getCompletedPartNumbers(attempt));
  const [isCompletingPart, setIsCompletingPart] = useState(false);

  const partQueries = useQueries({
    queries: [1, 2, 3, 4, 5, 6, 7].map((partNumber) => ({
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

    for (let index = 0; index < partQueries.length; index += 1) {
      const partNumber = index + 1;
      if (partQueries[index]?.data?.groups) {
        groups[partNumber] = partQueries[index].data!.groups;
      }
    }

    return groups;
  }, [partQueries]);

  const questions = useMemo(
    () => buildFullTestQuestions(partGroups),
    [partGroups],
  );

  const allPartsLoaded = partQueries.every((query) => query.data);
  const partLoadError = partQueries.find((query) => query.error)?.error;

  const { sessions, isStarting, startError, allReady } =
    useFullTestPracticeSessions({
      accessToken,
      clearSession,
      testId,
      partGroups,
      enabled: allPartsLoaded,
    });

  const [globalIndex, setGlobalIndex] = useState(() =>
    resolveInitialGlobalIndex(attemptId, questions, attempt.currentPartNumber),
  );

  const activeIndex =
    questions.length === 0 ? 0 : Math.min(globalIndex, questions.length - 1);
  const currentItem = questions[activeIndex] ?? null;
  const practice = currentItem ? getFullTestSession(sessions, currentItem.partNumber) : null;

  const groupQuestions = useMemo(() => {
    if (!currentItem) {
      return [];
    }

    const partGroupList = partGroups[currentItem.partNumber] ?? [];
    const group =
      findGroupForQuestion(partGroupList, currentItem.question.id) ?? currentItem.group;

    return [...group.questions].sort(
      (left, right) => left.questionNumber - right.questionNumber,
    );
  }, [currentItem, partGroups]);

  const completePart = useCallback(
    async (partNumber: number) => {
      if (completedPartsRef.current.has(partNumber)) {
        return attempt;
      }

      const session = getFullTestSession(sessions, partNumber);
      const updatedAttempt = await runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          completeTestAttemptPart(token, attemptId, partNumber, {
            correctCount: session.correctCount,
            wrongCount: session.wrongCount,
          }),
      });

      completedPartsRef.current.add(partNumber);
      await queryClient.invalidateQueries({
        queryKey: ["test-attempt", attemptId],
      });

      return updatedAttempt;
    },
    [accessToken, attempt, attemptId, clearSession, queryClient, sessions],
  );

  const goToGlobalIndex = useCallback(
    async (nextIndex: number) => {
      if (!currentItem || questions.length === 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(nextIndex, questions.length - 1));
      if (boundedIndex === activeIndex) {
        return;
      }

      const leavingPart = currentItem.partNumber;
      const nextItem = questions[boundedIndex];
      const enteringPart = nextItem.partNumber;

      if (boundedIndex > activeIndex && enteringPart !== leavingPart) {
        setIsCompletingPart(true);
        try {
          await completePart(leavingPart);
        } finally {
          setIsCompletingPart(false);
        }
      }

      setGlobalIndex(boundedIndex);
      writeFullTestIndex(attemptId, boundedIndex);
    },
    [activeIndex, attemptId, completePart, currentItem, questions],
  );

  const handleExit = useCallback(async () => {
    const isOnLastQuestion = activeIndex === questions.length - 1;

    if (isOnLastQuestion && currentItem?.partNumber === 7) {
      setIsCompletingPart(true);
      try {
        const updatedAttempt = await completePart(7);
        if (updatedAttempt.completedAt) {
          router.push(`/tests/${testId}/attempt/${attemptId}/results`);
          return;
        }
      } finally {
        setIsCompletingPart(false);
      }
    }

    router.push("/tests");
  }, [
    activeIndex,
    attemptId,
    completePart,
    currentItem?.partNumber,
    questions.length,
    router,
    testId,
  ]);

  const anySessionReady = Object.values(sessions).some(
    (session) => session.sessionId != null,
  );
  useRegisterPracticeExit(anySessionReady ? handleExit : null);

  const isLastQuestion = activeIndex >= questions.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      nextAriaLabel="Next"
      nextDisabled={isLastQuestion || isCompletingPart}
      onNext={() => {
        void goToGlobalIndex(activeIndex + 1);
      }}
      onPrevious={() => {
        void goToGlobalIndex(activeIndex - 1);
      }}
      previousDisabled={activeIndex === 0 || isCompletingPart}
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

  if (questions.length === 0) {
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

  if (isStarting || !allReady || !currentItem || !practice?.sessionId) {
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
      <FullTestQuestionScreen
        accessToken={accessToken}
        clearSession={clearSession}
        groupQuestions={groupQuestions}
        item={currentItem}
        key={`${currentItem.group.id}-${practice.sessionId}`}
        navigation={navigationBar}
        practice={practice}
        testId={testId}
      />
    </PageShell>
  );
}

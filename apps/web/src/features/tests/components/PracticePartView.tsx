"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTestPart } from "@/features/tests/api/testsApi";
import type { PracticeMode, ToeicQuestionGroup } from "@/features/tests/api/types";
import { ListeningGroupPracticeContent } from "@/features/tests/components/ListeningGroupPracticeContent";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
import { PracticeQuestionPrompt } from "@/features/tests/components/PracticeQuestionPrompt";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import {
  getPracticeSessionQueryKey,
  usePracticeSession,
} from "@/features/tests/hooks/usePracticeSession";
import { getPracticeStatsQueryKey } from "@/features/tests/hooks/usePracticeStats";
import {
  getWrongQuestionsQueryKey,
  useWrongQuestions,
} from "@/features/tests/hooks/useWrongQuestions";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import {
  getPartPracticeConfig,
  isSupportedPracticePart,
} from "@/features/tests/lib/partPracticeConfig";
import {
  syncPracticeProgressSession,
  writePracticeIndex,
} from "@/features/tests/lib/practiceStorage";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { PracticeSplitPlainLayout } from "@/features/tests/components/PracticeSplitPlainLayout";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

import {
  buildPracticeGroups,
  buildWrongReviewGroups,
  type PracticeItem,
} from "@/features/tests/lib/practiceGroups";
import { buildAnswerKeyMap } from "@/features/tests/lib/answerKeyMap";
import { isPracticeAnswerGraded, getQuestionGridResultFromAnswer } from "@/features/tests/lib/practiceAnswers";
import {
  buildItemGridSection,
  findItemIndexForQuestion,
} from "@/features/tests/lib/practiceQuestionGrid";
import { useRegisterPracticeExit } from "@/features/tests/providers/PracticeExitProvider";

type PracticePartViewProps = {
  testId: number;
  partNumber: number;
  practiceMode: PracticeMode;
  accessToken: string | null;
  clearSession: () => void;
};

function flattenPracticeItems(groups: ToeicQuestionGroup[]): PracticeItem[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question })),
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type PracticePartContentProps = {
  testId: number;
  partNumber: number;
  practiceMode: PracticeMode;
  items: PracticeItem[];
  initialIndex: number;
  practice: ReturnType<typeof usePracticeSession>;
  accessToken: string | null;
  clearSession: () => void;
};

function PracticePartContent({
  testId,
  partNumber,
  practiceMode,
  items,
  initialIndex,
  practice,
  accessToken,
  clearSession,
}: PracticePartContentProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const activeIndex =
    items.length === 0 ? 0 : Math.min(currentIndex, items.length - 1);
  const currentItem = items[activeIndex] ?? null;

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: currentItem?.group ?? null,
    accessToken,
    clearSession,
  });

  const currentAnswer = currentItem
    ? practice.getAnswer(currentItem.question.id)
    : undefined;
  const isAnswered = isPracticeAnswerGraded(currentAnswer);
  const questionId = currentItem?.question.id;

  const goToIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, items.length - 1));
    setCurrentIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const handleSelect = (key: "A" | "B" | "C" | "D") => {
    if (!currentItem || isAnswered) {
      return;
    }

    practice.selectAnswer(currentItem.question.id, key);
  };

  const handleNext = () => {
    if (activeIndex >= items.length - 1) {
      return;
    }

    goToIndex(activeIndex + 1);
  };

  const isLastItem = activeIndex >= items.length - 1;

  const activeQuestionNumbers = useMemo(() => {
    const numbers = new Set<number>();
    if (currentItem) {
      numbers.add(currentItem.question.questionNumber);
    }
    return numbers;
  }, [currentItem]);

  const questionGridSections = useMemo(
    () => [
      buildItemGridSection(
        partNumber,
        items,
        activeQuestionNumbers,
        (questionId) => getQuestionGridResultFromAnswer(practice.getAnswer(questionId)),
      ),
    ],
    [activeQuestionNumbers, items, partNumber, practice],
  );

  if (!currentItem) {
    return null;
  }

  const navigationBar = (
    <PracticeNavigationButtons
      nextDisabled={isLastItem}
      onNext={handleNext}
      onPrevious={() => goToIndex(activeIndex - 1)}
      onQuestionGridSelect={(questionNumber) => {
        const index = findItemIndexForQuestion(items, questionNumber);
        if (index >= 0) {
          goToIndex(index);
        }
      }}
      previousDisabled={activeIndex === 0}
      questionGridSections={questionGridSections}
    />
  );

  const leftPanel = (
    <PracticeLeftPanel
      audioUrl={signedMedia.audioUrl}
      group={currentItem.group}
      imageUrl={signedMedia.imageUrl}
      mediaError={signedMedia.mediaError}
      onMediaError={signedMedia.handleMediaError}
      partConfig={partConfig}
      plain={partConfig.contentLayout === "split-plain"}
      questionNumber={currentItem.question.questionNumber}
      questionText={currentItem.question.question}
      showContext={
        partConfig.leftPanel !== "listening-group" ||
        !partConfig.hideContextUntilGroupComplete ||
        isAnswered
      }
      showContextTranslation={isAnswered}
    />
  );

  const optionsPanel = (
    <>
      <QuestionOptions
        answerKey={currentAnswer?.answerKey ?? null}
        isLocked={isAnswered}
        isSubmitting={questionId ? practice.isQuestionPending(questionId) : false}
        onSelect={handleSelect}
        optionCount={currentItem.question.optionCount}
        options={currentItem.question.options}
        selectedKey={currentAnswer?.selectedKey ?? null}
        showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
      />
      <QuestionTranslationPanel
        optionCount={currentItem.question.optionCount}
        options={currentItem.question.options}
        questionVi={currentItem.question.questionVi}
        variant={partConfig.translationVariant}
        visible={isAnswered}
      />
    </>
  );

  const syncFailureBanner =
    questionId && practice.isQuestionSyncFailed(questionId) ? (
      <p className="text-base text-red-600">
        Could not save this answer.{" "}
        <button
          className="underline"
          onClick={() => practice.retrySync(questionId)}
          type="button"
        >
          Retry
        </button>
      </p>
    ) : null;

  const optionsPanelWithSync = (
    <>
      {optionsPanel}
      {syncFailureBanner}
    </>
  );

  if (partConfig.contentLayout === "split-plain") {
    return (
      <PracticeSplitPlainLayout
        left={partConfig.leftPanel !== "none" ? leftPanel : null}
        navigation={navigationBar}
        right={
          <div className="flex flex-col gap-4">
            <PracticeQuestionPrompt
              questionNumber={currentItem.question.questionNumber}
              questionText={
                partConfig.showQuestionInRightPanel
                  ? currentItem.question.question
                  : null
              }
            />
            {optionsPanelWithSync}
          </div>
        }
      />
    );
  }

  return (
    <>
      <div>
        <p className="text-base text-muted-foreground">
          Test {testId} · Part {partNumber}
          {practiceMode === "wrong_questions" ? " · Review wrong" : ""}
        </p>
        <h1 className="text-xl font-semibold">
          Question {currentItem.question.questionNumber} / {items.length}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {practiceMode === "wrong_questions"
            ? `Fixed ${practice.correctCount} · ${items.length} questions`
            : `Correct ${practice.correctCount} · Wrong ${practice.wrongCount}`}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {leftPanel}

        <div className="flex min-h-0 flex-col gap-4">
          {partConfig.showQuestionInRightPanel &&
          currentItem.question.question?.trim() ? (
            <div className="rounded-xl border border-border p-4">
              <h3 className="mb-2 text-base font-semibold">Question</h3>
              <p className="text-base leading-relaxed select-text">
                {currentItem.question.question}
              </p>
            </div>
          ) : null}

          {optionsPanelWithSync}
        </div>
      </div>

      {navigationBar}
    </>
  );
}

export function PracticePartView({
  testId,
  partNumber,
  practiceMode,
  accessToken,
  clearSession,
}: PracticePartViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isWrongMode = practiceMode === "wrong_questions";
  const isSupportedPart = isSupportedPracticePart(partNumber);

  const partQuery = useQuery({
    queryKey: ["test-part", testId, partNumber],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => getTestPart(token, testId, partNumber, { signal }),
      }),
    enabled: Boolean(accessToken) && isSupportedPart,
  });

  const allItems = useMemo(
    () => flattenPracticeItems(partQuery.data?.groups ?? []),
    [partQuery.data?.groups],
  );

  const answerKeyMap = useMemo(
    () => buildAnswerKeyMap(partQuery.data?.groups ?? []),
    [partQuery.data?.groups],
  );

  const { wrongQuestions, isLoadingWrongQuestions, wrongQuestionsError } =
    useWrongQuestions({
      accessToken,
      clearSession,
      testId,
      partNumber,
      enabled: Boolean(partQuery.data) && isWrongMode,
    });

  const practice = usePracticeSession({
    accessToken,
    clearSession,
    testId,
    partNumber,
    mode: practiceMode,
    answerKeyMap,
    enabled:
      isSupportedPart &&
      Boolean(partQuery.data) &&
      (!isWrongMode || !isLoadingWrongQuestions),
  });

  const partConfig = getPartPracticeConfig(partNumber);
  const isWrongGroupReview =
    isWrongMode && partConfig.navigationMode === "per-group";

  const normalPractice = usePracticeSession({
    accessToken,
    clearSession,
    testId,
    partNumber,
    mode: "normal",
    answerKeyMap,
    enabled:
      isSupportedPart &&
      Boolean(partQuery.data) &&
      isWrongGroupReview &&
      Boolean(practice.sessionId),
  });

  const frozenWrongQuestionIds = useMemo(() => {
    if (!isWrongMode || !practice.sessionId || wrongQuestions.length === 0) {
      return null;
    }

    return wrongQuestions.map((item) => item.toeicQuestionId);
    // Freeze the review pool when a session starts; correct answers must not shrink it mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wrongQuestions intentionally omitted
  }, [isWrongMode, practice.sessionId]);

  const items = useMemo(() => {
    if (!isWrongMode) {
      return allItems;
    }

    if (!frozenWrongQuestionIds) {
      return [];
    }

    const frozenIds = new Set(frozenWrongQuestionIds);
    return allItems.filter((item) => frozenIds.has(item.question.id));
  }, [allItems, frozenWrongQuestionIds, isWrongMode]);

  const practiceGroups = useMemo(() => {
    if (isWrongGroupReview && frozenWrongQuestionIds && partQuery.data?.groups) {
      return buildWrongReviewGroups(
        partQuery.data.groups,
        frozenWrongQuestionIds,
      );
    }

    return buildPracticeGroups(items);
  }, [frozenWrongQuestionIds, isWrongGroupReview, items, partQuery.data]);

  const initialIndex = useMemo(() => {
    if (!practice.sessionId || items.length === 0) {
      return 0;
    }

    return Math.min(
      syncPracticeProgressSession(testId, partNumber, practice.sessionId),
      items.length - 1,
    );
  }, [items.length, partNumber, practice.sessionId, testId]);

  const initialGroupIndex = useMemo(() => {
    if (!practice.sessionId || practiceGroups.length === 0) {
      return 0;
    }

    if (partConfig.navigationMode === "per-group") {
      return Math.min(
        syncPracticeProgressSession(testId, partNumber, practice.sessionId),
        practiceGroups.length - 1,
      );
    }

    return 0;
  }, [
    partConfig.navigationMode,
    partNumber,
    practice.sessionId,
    practiceGroups.length,
    testId,
  ]);

  const { sessionId, completeSession } = practice;

  const handleExit = useCallback(async () => {
    if (isWrongMode && sessionId) {
      await completeSession();
      void queryClient.invalidateQueries({
        queryKey: getPracticeStatsQueryKey(testId),
      });
      void queryClient.invalidateQueries({
        queryKey: getWrongQuestionsQueryKey(testId, partNumber),
      });
      void queryClient.invalidateQueries({
        queryKey: getPracticeSessionQueryKey(testId, partNumber, "normal"),
      });
    }

    router.push("/tests");
  }, [
    completeSession,
    isWrongMode,
    partNumber,
    queryClient,
    router,
    sessionId,
    testId,
  ]);

  useRegisterPracticeExit(sessionId ? handleExit : null);

  if (!isSupportedPart) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">This part is not supported.</p>
        </Panel>
      </PageShell>
    );
  }

  if (
    partQuery.isLoading ||
    practice.isStarting ||
    (isWrongMode && isLoadingWrongQuestions) ||
    (isWrongGroupReview && normalPractice.isStarting)
  ) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (partQuery.error || practice.startError || wrongQuestionsError) {
    const message =
      practice.startError ??
      wrongQuestionsError ??
      getErrorMessage(partQuery.error, "Cannot load this test part.");

    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">{message}</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/tests")} type="button" variant="secondary">
              Back to tests
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (isWrongMode && wrongQuestions.length === 0) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            No wrong questions left to review for this part.
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

  if (allItems.length === 0) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            This part has no questions yet. Check that TOEIC data is imported for this test.
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

  if (!practice.sessionId) {
    return null;
  }

  if (!isWrongGroupReview && items.length === 0) {
    return null;
  }

  if (isWrongGroupReview && practiceGroups.length === 0) {
    return null;
  }

  if (partConfig.navigationMode === "per-group") {
    const usesSplitPlainLayout = partConfig.contentLayout === "split-plain";
    const groupContent = (
      <ListeningGroupPracticeContent
        accessToken={accessToken}
        clearSession={clearSession}
        groups={practiceGroups}
        initialGroupIndex={initialGroupIndex}
        key={practice.sessionId}
        normalPractice={isWrongGroupReview ? normalPractice : undefined}
        partNumber={partNumber}
        practice={practice}
        practiceMode={practiceMode}
        testId={testId}
        wrongQuestionCount={
          isWrongGroupReview ? frozenWrongQuestionIds?.length : undefined
        }
      />
    );

    return (
      <PageShell fillViewport>
        {usesSplitPlainLayout ? (
          groupContent
        ) : (
          <Panel className="flex min-h-0 flex-1 flex-col gap-4">
            {groupContent}
          </Panel>
        )}
      </PageShell>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const usesSplitPlainLayout = partConfig.contentLayout === "split-plain";

  if (usesSplitPlainLayout) {
    return (
      <PageShell fillViewport>
        <PracticePartContent
          accessToken={accessToken}
          clearSession={clearSession}
          initialIndex={initialIndex}
          items={items}
          key={practice.sessionId}
          partNumber={partNumber}
          practice={practice}
          practiceMode={practiceMode}
          testId={testId}
        />
      </PageShell>
    );
  }

  return (
    <PageShell fillViewport>
      <Panel className="flex min-h-0 flex-1 flex-col gap-4">
        <PracticePartContent
          accessToken={accessToken}
          clearSession={clearSession}
          initialIndex={initialIndex}
          items={items}
          key={practice.sessionId}
          partNumber={partNumber}
          practice={practice}
          practiceMode={practiceMode}
          testId={testId}
        />
      </Panel>
    </PageShell>
  );
}

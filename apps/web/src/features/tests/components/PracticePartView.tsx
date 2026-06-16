"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTestPart } from "@/features/tests/api/testsApi";
import type { PracticeMode, ToeicQuestionGroup } from "@/features/tests/api/types";
import { ListeningGroupPracticeContent } from "@/features/tests/components/ListeningGroupPracticeContent";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
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
import { classNames } from "@/shared/lib/classNames";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

import {
  buildPracticeGroups,
  buildWrongReviewGroups,
  type PracticeItem,
} from "@/features/tests/lib/practiceGroups";

export type FullTestContext = {
  attemptId: string;
  onPartComplete: (result: {
    correctCount: number;
    wrongCount: number;
  }) => Promise<void>;
};

type PracticePartViewProps = {
  testId: number;
  partNumber: number;
  practiceMode: PracticeMode;
  accessToken: string | null;
  clearSession: () => void;
  fullTestContext?: FullTestContext;
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
  fullTestContext?: FullTestContext;
  onFinish: () => void;
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
  fullTestContext,
  onFinish,
}: PracticePartContentProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFinishing, setIsFinishing] = useState(false);
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
  const isAnswered = Boolean(currentAnswer);

  const goToIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, items.length - 1));
    setCurrentIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const handleSelect = async (key: "A" | "B" | "C" | "D") => {
    if (!currentItem || currentAnswer || practice.isSubmitting) {
      return;
    }

    await practice.submitAnswer(currentItem.question.id, key);
  };

  const handleFinish = async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    try {
      if (fullTestContext) {
        await fullTestContext.onPartComplete({
          correctCount: practice.correctCount,
          wrongCount: practice.wrongCount,
        });
      } else if (practiceMode === "wrong_questions") {
        await practice.completeSession();
      }

      onFinish();
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (activeIndex >= items.length - 1) {
      void handleFinish();
      return;
    }

    goToIndex(activeIndex + 1);
  };

  if (!currentItem) {
    return null;
  }

  const finishLabel = fullTestContext
    ? partNumber >= 7
      ? "Finish test"
      : "Next part"
    : "Finish";

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground">
          Test {testId}
          {fullTestContext ? " · Full test" : ""} · Part {partNumber}
          {practiceMode === "wrong_questions" ? " · Review wrong" : ""}
        </p>
        <h1 className="text-xl font-semibold">
          Question {currentItem.question.questionNumber} / {items.length}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {practiceMode === "wrong_questions"
            ? `Fixed ${practice.correctCount} · ${items.length} questions`
            : `Correct ${practice.correctCount} · Wrong ${practice.wrongCount}`}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <PracticeLeftPanel
          audioUrl={signedMedia.audioUrl}
          group={currentItem.group}
          imageUrl={signedMedia.imageUrl}
          mediaError={signedMedia.mediaError}
          onMediaError={signedMedia.handleMediaError}
          partConfig={partConfig}
          questionNumber={currentItem.question.questionNumber}
          questionText={currentItem.question.question}
          showContext={
            partConfig.leftPanel !== "listening-group" ||
            !partConfig.hideContextUntilGroupComplete ||
            isAnswered
          }
          showContextTranslation={isAnswered}
        />

        <div className="flex min-h-0 flex-col gap-4">
          {partConfig.showQuestionInRightPanel &&
          currentItem.question.question?.trim() ? (
            <div className="rounded-xl border border-border p-4">
              <h3 className="mb-2 text-sm font-semibold">Question</h3>
              <p className="text-sm leading-relaxed select-text">
                {currentItem.question.question}
              </p>
            </div>
          ) : null}

          <QuestionOptions
            answerKey={currentAnswer?.answerKey ?? null}
            isLocked={isAnswered}
            isSubmitting={practice.isSubmitting}
            onSelect={handleSelect}
            optionCount={currentItem.question.optionCount}
            options={currentItem.question.options}
            selectedKey={currentAnswer?.selectedKey ?? null}
            showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
          />
          <QuestionTranslationPanel
            contentVi={currentItem.group.contentVi}
            optionCount={currentItem.question.optionCount}
            options={currentItem.question.options}
            questionVi={currentItem.question.questionVi}
            variant={partConfig.translationVariant}
            visible={isAnswered}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          disabled={activeIndex === 0 || isFinishing}
          onClick={() => goToIndex(activeIndex - 1)}
          type="button"
          variant="secondary"
        >
          Prev
        </Button>
        <Button
          className={classNames(activeIndex >= items.length - 1 && "min-w-32")}
          disabled={practice.isSubmitting || isFinishing}
          onClick={handleNext}
          type="button"
        >
          {activeIndex >= items.length - 1 ? finishLabel : "Next"}
        </Button>
      </div>
    </>
  );
}

export function PracticePartView({
  testId,
  partNumber,
  practiceMode,
  accessToken,
  clearSession,
  fullTestContext,
}: PracticePartViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isWrongMode = practiceMode === "wrong_questions";
  const effectiveMode = fullTestContext ? "normal" : practiceMode;
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

  const { wrongQuestions, isLoadingWrongQuestions, wrongQuestionsError } =
    useWrongQuestions({
      accessToken,
      clearSession,
      testId,
      partNumber,
      enabled: Boolean(partQuery.data) && isWrongMode && !fullTestContext,
    });

  const practice = usePracticeSession({
    accessToken,
    clearSession,
    testId,
    partNumber,
    mode: effectiveMode,
    enabled:
      isSupportedPart &&
      Boolean(partQuery.data) &&
      (!isWrongMode || !isLoadingWrongQuestions || Boolean(fullTestContext)),
  });

  const partConfig = getPartPracticeConfig(partNumber);
  const isWrongGroupReview =
    isWrongMode &&
    !fullTestContext &&
    partConfig.navigationMode === "per-group";

  const normalPractice = usePracticeSession({
    accessToken,
    clearSession,
    testId,
    partNumber,
    mode: "normal",
    enabled:
      isSupportedPart &&
      Boolean(partQuery.data) &&
      isWrongGroupReview &&
      Boolean(practice.sessionId),
  });

  const frozenWrongQuestionIds = useMemo(() => {
    if (!isWrongMode || fullTestContext || !practice.sessionId || wrongQuestions.length === 0) {
      return null;
    }

    return wrongQuestions.map((item) => item.toeicQuestionId);
    // Freeze the review pool when a session starts; correct answers must not shrink it mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wrongQuestions intentionally omitted
  }, [fullTestContext, isWrongMode, practice.sessionId]);

  const items = useMemo(() => {
    if (!isWrongMode || fullTestContext) {
      return allItems;
    }

    if (!frozenWrongQuestionIds) {
      return [];
    }

    const frozenIds = new Set(frozenWrongQuestionIds);
    return allItems.filter((item) => frozenIds.has(item.question.id));
  }, [allItems, frozenWrongQuestionIds, fullTestContext, isWrongMode]);

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

  const handleFinish = () => {
    if (isWrongMode && !fullTestContext) {
      void queryClient.invalidateQueries({
        queryKey: getPracticeStatsQueryKey(testId),
      });
      void queryClient.invalidateQueries({
        queryKey: getWrongQuestionsQueryKey(testId, partNumber),
      });
      void queryClient.invalidateQueries({
        queryKey: getPracticeSessionQueryKey(testId, partNumber, "normal"),
      });
      router.push("/tests");
      return;
    }

    if (fullTestContext) {
      return;
    }

    router.push("/tests");
  };

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
    (isWrongMode && !fullTestContext && isLoadingWrongQuestions) ||
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

  if (isWrongMode && !fullTestContext && wrongQuestions.length === 0) {
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
    return (
      <PageShell fillViewport>
        <Panel className="flex min-h-0 flex-1 flex-col gap-4">
          <ListeningGroupPracticeContent
            accessToken={accessToken}
            clearSession={clearSession}
            fullTestContext={fullTestContext}
            groups={practiceGroups}
            initialGroupIndex={initialGroupIndex}
            key={practice.sessionId}
            normalPractice={isWrongGroupReview ? normalPractice : undefined}
            onFinish={handleFinish}
            partNumber={partNumber}
            practice={practice}
            practiceMode={practiceMode}
            testId={testId}
            wrongQuestionCount={
              isWrongGroupReview ? frozenWrongQuestionIds?.length : undefined
            }
          />
        </Panel>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <PageShell fillViewport>
      <Panel className="flex min-h-0 flex-1 flex-col gap-4">
        <PracticePartContent
          accessToken={accessToken}
          clearSession={clearSession}
          fullTestContext={fullTestContext}
          initialIndex={initialIndex}
          items={items}
          key={practice.sessionId}
          onFinish={handleFinish}
          partNumber={partNumber}
          practice={practice}
          practiceMode={practiceMode}
          testId={testId}
        />
      </Panel>
    </PageShell>
  );
}

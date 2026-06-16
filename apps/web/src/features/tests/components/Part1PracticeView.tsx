"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTestPart } from "@/features/tests/api/testsApi";
import type { PracticeMode, ToeicQuestionGroup } from "@/features/tests/api/types";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import {
  usePracticeSession,
} from "@/features/tests/hooks/usePracticeSession";
import { getPracticeStatsQueryKey } from "@/features/tests/hooks/usePracticeStats";
import { useWrongQuestions, getWrongQuestionsQueryKey } from "@/features/tests/hooks/useWrongQuestions";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import {
  syncPracticeProgressSession,
  writePracticeIndex,
} from "@/features/tests/lib/practiceStorage";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { classNames } from "@/shared/lib/classNames";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type Part1Item = {
  group: ToeicQuestionGroup;
  question: ToeicQuestionGroup["questions"][number];
};

type Part1PracticeViewProps = {
  testId: number;
  partNumber: number;
  practiceMode: PracticeMode;
  accessToken: string | null;
  clearSession: () => void;
};

function flattenPart1Items(groups: ToeicQuestionGroup[]): Part1Item[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question })),
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type Part1PracticeContentProps = {
  testId: number;
  partNumber: number;
  practiceMode: PracticeMode;
  items: Part1Item[];
  initialIndex: number;
  practice: ReturnType<typeof usePracticeSession>;
  accessToken: string | null;
  clearSession: () => void;
  onFinish: () => void;
};

function Part1PracticeContent({
  testId,
  partNumber,
  practiceMode,
  items,
  initialIndex,
  practice,
  accessToken,
  clearSession,
  onFinish,
}: Part1PracticeContentProps) {
  const queryClient = useQueryClient();
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

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getPracticeStatsQueryKey(testId),
      }),
      queryClient.invalidateQueries({
        queryKey: getWrongQuestionsQueryKey(testId, partNumber),
      }),
    ]);
  };

  const handleNext = () => {
    if (activeIndex >= items.length - 1) {
      onFinish();
      return;
    }

    goToIndex(activeIndex + 1);
  };

  if (!currentItem) {
    return null;
  }

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground">
          Test {testId} · Part {partNumber}
          {practiceMode === "wrong_questions" ? " · Review wrong" : ""}
        </p>
        <h1 className="text-xl font-semibold">
          Question {currentItem.question.questionNumber} / {items.length}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {practiceMode === "wrong_questions"
            ? `Fixed ${practice.correctCount} · Remaining ${items.length}`
            : `Correct ${practice.correctCount} · Wrong ${practice.wrongCount}`}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border p-4">
          {signedMedia.audioUrl ? (
            <audio
              controls
              className="w-full"
              key={signedMedia.audioUrl}
              onError={signedMedia.handleMediaError}
              src={signedMedia.audioUrl}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No audio available.</p>
          )}
          {signedMedia.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
            <img
              alt={`Question ${currentItem.question.questionNumber}`}
              className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
              key={signedMedia.imageUrl}
              onError={signedMedia.handleMediaError}
              src={signedMedia.imageUrl}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No image available.</p>
          )}
          {signedMedia.mediaError ? (
            <p className="text-sm text-red-600">{signedMedia.mediaError}</p>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <QuestionOptions
            answerKey={currentAnswer?.answerKey ?? null}
            isAnswered={Boolean(currentAnswer)}
            isSubmitting={practice.isSubmitting}
            onSelect={handleSelect}
            optionCount={currentItem.question.optionCount}
            options={currentItem.question.options}
            selectedKey={currentAnswer?.selectedKey ?? null}
          />
          <QuestionTranslationPanel
            optionCount={currentItem.question.optionCount}
            options={currentItem.question.options}
            visible={Boolean(currentAnswer)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          disabled={activeIndex === 0}
          onClick={() => goToIndex(activeIndex - 1)}
          type="button"
          variant="secondary"
        >
          Prev
        </Button>
        <Button
          className={classNames(activeIndex >= items.length - 1 && "min-w-32")}
          disabled={practice.isSubmitting}
          onClick={handleNext}
          type="button"
        >
          {activeIndex >= items.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </>
  );
}

export function Part1PracticeView({
  testId,
  partNumber,
  practiceMode,
  accessToken,
  clearSession,
}: Part1PracticeViewProps) {
  const router = useRouter();
  const isWrongMode = practiceMode === "wrong_questions";

  const partQuery = useQuery({
    queryKey: ["test-part", testId, partNumber],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => getTestPart(token, testId, partNumber, { signal }),
      }),
    enabled: Boolean(accessToken),
  });

  const allItems = useMemo(
    () => flattenPart1Items(partQuery.data?.groups ?? []),
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

  const wrongQuestionIds = useMemo(
    () => new Set(wrongQuestions.map((item) => item.toeicQuestionId)),
    [wrongQuestions],
  );

  const items = useMemo(() => {
    if (!isWrongMode) {
      return allItems;
    }

    return allItems.filter((item) => wrongQuestionIds.has(item.question.id));
  }, [allItems, isWrongMode, wrongQuestionIds]);

  const practice = usePracticeSession({
    accessToken,
    clearSession,
    testId,
    partNumber,
    mode: practiceMode,
    enabled: Boolean(partQuery.data) && (!isWrongMode || !isLoadingWrongQuestions),
  });

  const initialIndex = useMemo(() => {
    if (!practice.sessionId || items.length === 0) {
      return 0;
    }

    return Math.min(
      syncPracticeProgressSession(testId, partNumber, practice.sessionId),
      items.length - 1,
    );
  }, [items.length, partNumber, practice.sessionId, testId]);

  if (partQuery.isLoading || practice.isStarting || (isWrongMode && isLoadingWrongQuestions)) {
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

  if (items.length === 0) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {isWrongMode
              ? "No wrong questions left to review for this part."
              : "This part has no questions yet. Check that TOEIC data is imported for this test."}
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

  return (
    <PageShell fillViewport>
      <Panel className="flex min-h-0 flex-1 flex-col gap-4">
        <Part1PracticeContent
          accessToken={accessToken}
          clearSession={clearSession}
          initialIndex={initialIndex}
          items={items}
          key={practice.sessionId}
          onFinish={() => router.push("/tests")}
          partNumber={partNumber}
          practice={practice}
          practiceMode={practiceMode}
          testId={testId}
        />
      </Panel>
    </PageShell>
  );
}

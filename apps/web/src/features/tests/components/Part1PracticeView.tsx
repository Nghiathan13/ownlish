"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTestPart } from "@/features/tests/api/testsApi";
import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
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
  accessToken: string | null;
  clearSession: () => void;
};

function flattenPart1Items(groups: ToeicQuestionGroup[]): Part1Item[] {
  return groups.flatMap((group) =>
    group.questions.map((question) => ({ group, question })),
  );
}

export function Part1PracticeView({
  testId,
  partNumber,
  accessToken,
  clearSession,
}: Part1PracticeViewProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(
    null,
  );
  const [answerKey, setAnswerKey] = useState<"A" | "B" | "C" | "D" | null>(
    null,
  );
  const [revealedEnglish, setRevealedEnglish] = useState<
    Partial<Record<"A" | "B" | "C" | "D", string | null>>
  >({});

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

  const items = useMemo(
    () => flattenPart1Items(partQuery.data?.groups ?? []),
    [partQuery.data?.groups],
  );
  const currentItem = items[currentIndex] ?? null;

  const practice = usePracticeSession({
    accessToken,
    clearSession,
    testId,
    partNumber,
    enabled: Boolean(partQuery.data),
  });

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: currentItem?.group ?? null,
    accessToken,
    clearSession,
  });

  const resetQuestionState = () => {
    setSelectedKey(null);
    setAnswerKey(null);
    setRevealedEnglish({});
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    resetQuestionState();
  };

  const handleSelect = async (key: "A" | "B" | "C" | "D") => {
    if (!currentItem || selectedKey || practice.isSubmitting) {
      return;
    }

    const result = await practice.submitAnswer(currentItem.question.id, key);
    if (!result) {
      return;
    }

    setSelectedKey(key);
    setAnswerKey(result.answerKey);
    setRevealedEnglish((current) => ({
      ...current,
      [key]: currentItem.question.options[key],
    }));
  };

  const handleNext = async () => {
    if (currentIndex >= items.length - 1) {
      await practice.completeSession();
      return;
    }

    goToIndex(currentIndex + 1);
  };

  if (partQuery.isLoading || practice.isStarting) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (partQuery.error || practice.startError || !currentItem) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            {practice.startError ?? "Cannot load this test part."}
          </p>
        </Panel>
      </PageShell>
    );
  }

  if (practice.completion) {
    return (
      <PageShell>
        <Panel>
          <h1 className="mb-2 text-2xl font-semibold">Hoàn thành Part 1</h1>
          <p className="mb-6 text-muted-foreground">
            Đúng {practice.completion.correctCount} / Sai{" "}
            {practice.completion.wrongCount}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/tests")} type="button">
              Về danh sách test
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell fillViewport>
      <Panel className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Test {testId} · Part {partNumber}
            </p>
            <h1 className="text-xl font-semibold">
              Câu {currentItem.question.questionNumber} / {items.length}
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Đúng {practice.correctCount} · Sai {practice.wrongCount}
          </div>
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
              <p className="text-sm text-muted-foreground">Không có audio.</p>
            )}
            {signedMedia.imageUrl ? (
              <img
                alt={`Question ${currentItem.question.questionNumber}`}
                className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
                key={signedMedia.imageUrl}
                onError={signedMedia.handleMediaError}
                src={signedMedia.imageUrl}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Không có hình ảnh.</p>
            )}
            {signedMedia.mediaError ? (
              <p className="text-sm text-red-600">{signedMedia.mediaError}</p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <QuestionOptions
              answerKey={answerKey}
              disabled={Boolean(selectedKey) || practice.isSubmitting}
              onSelect={handleSelect}
              optionCount={currentItem.question.optionCount}
              revealedEnglish={revealedEnglish}
              selectedKey={selectedKey}
            />
          </div>
        </div>

        <QuestionTranslationPanel
          optionCount={currentItem.question.optionCount}
          options={currentItem.question.options}
        />

        <div className="flex items-center justify-between gap-3">
          <Button
            disabled={currentIndex === 0}
            onClick={() => goToIndex(currentIndex - 1)}
            type="button"
            variant="secondary"
          >
            Prev
          </Button>
          <Button
            className={classNames(currentIndex >= items.length - 1 && "min-w-32")}
            disabled={!selectedKey || practice.isSubmitting}
            onClick={() => void handleNext()}
            type="button"
          >
            {currentIndex >= items.length - 1 ? "Hoàn thành" : "Next"}
          </Button>
        </div>
      </Panel>
    </PageShell>
  );
}

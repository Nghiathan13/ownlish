"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getDefaultUserCollection,
  getUserOwnedCollections,
} from "@/entities/collection/lib/collectionDisplay";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { ImportTargetCollectionSelect } from "@/features/collections/shared/components/ImportTargetCollectionSelect";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import {
  ReviewCard,
  ReviewModeToggle,
  ReviewStateBlock,
  ReviewTypingCard,
  type ReviewMode,
  type TypingResult,
} from "@/features/review/components";
import { ReviewCollectionToolbarSkeleton } from "@/features/review/components/ReviewCollectionToolbarSkeleton";
import { useReviewQueue } from "@/features/review/hooks/useReviewQueue";
import { useTypingField } from "@/features/review/hooks/useTypingField";
import type { ReviewGrade } from "@/features/review/lib/reviewSchedule";
import { compareTypingAnswer } from "@/features/review/lib/typing";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

const REVIEW_MODE_STORAGE_KEY = "engvocab.reviewMode";

function readStoredReviewMode(): ReviewMode {
  if (typeof window === "undefined") {
    return "flashcard";
  }

  return window.localStorage.getItem(REVIEW_MODE_STORAGE_KEY) === "typing"
    ? "typing"
    : "flashcard";
}

export default function ReviewPage() {
  return (
    <RequireAuth>
      <ReviewPageContent />
    </RequireAuth>
  );
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const collectionIdFromUrl = searchParams.get("collectionId");
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    null,
  );
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("flashcard");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);
  const { collections, isLoadingCollections } = useCollectionsListQuery({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const userCollections = useMemo(() => {
    return getUserOwnedCollections(collections);
  }, [collections]);
  const defaultCollection = useMemo(() => {
    return getDefaultUserCollection(collections);
  }, [collections]);
  const collectionIdFromUrlValue = useMemo(() => {
    if (!collectionIdFromUrl) {
      return null;
    }

    return userCollections.some((collection) => collection.id === collectionIdFromUrl)
      ? collectionIdFromUrl
      : null;
  }, [collectionIdFromUrl, userCollections]);
  const resolvedCollectionId =
    selectedCollectionId ?? collectionIdFromUrlValue ?? defaultCollection?.id ?? null;
  const {
    currentWord,
    error,
    gradeCurrentWord,
    isEmpty,
    isLoading,
    isSubmittingGrade,
    reload,
    reviewedCount,
    totalWords,
  } = useReviewQueue({
    collectionId: resolvedCollectionId,
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const isTypingMode = reviewMode === "typing";
  const {
    typingInputRef,
    typingMeasureRef,
    typingFieldText,
    typingFieldStyle,
  } = useTypingField({
    typedAnswer,
    enabled: isTypingMode && Boolean(currentWord),
  });

  useEffect(() => {
    setReviewMode(readStoredReviewMode());
  }, []);

  useEffect(() => {
    setShowMeaning(false);
    setTypedAnswer("");
    setTypingResult(null);
  }, [currentWord?.id]);

  useEffect(() => {
    if (isTypingMode && !typingResult) {
      typingInputRef.current?.focus();
    }
  }, [currentWord?.id, isTypingMode, typingInputRef, typingResult]);

  const resetCardState = useCallback(() => {
    setShowMeaning(false);
    setTypedAnswer("");
    setTypingResult(null);
  }, []);

  const handleCollectionChange = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    resetCardState();
  }, [resetCardState]);

  const handleModeChange = useCallback((mode: ReviewMode) => {
    setReviewMode(mode);
    window.localStorage.setItem(REVIEW_MODE_STORAGE_KEY, mode);
    resetCardState();
  }, [resetCardState]);

  const handleGrade = useCallback(async (grade: ReviewGrade) => {
    const canGrade = isTypingMode ? Boolean(typingResult) : showMeaning;
    if (!canGrade) {
      return;
    }

    await gradeCurrentWord(grade);
    resetCardState();
  }, [gradeCurrentWord, isTypingMode, resetCardState, showMeaning, typingResult]);

  const handleTypingSubmit = useCallback(() => {
    if (!currentWord || typingResult) {
      return;
    }

    const submittedAnswer = typedAnswer.trim();
    setTypingResult({
      isCorrect: compareTypingAnswer(currentWord.vocabWord.word, submittedAnswer),
      submittedAnswer,
    });
  }, [currentWord, typedAnswer, typingResult]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!currentWord || isSubmittingGrade) {
        return;
      }

      if (isTypingMode) {
        if (event.key === "Enter") {
          event.preventDefault();
          handleTypingSubmit();
          return;
        }

        if (!typingResult) {
          return;
        }

        if (event.key === "1") {
          event.preventDefault();
          void handleGrade("forgot");
          return;
        }

        if (event.key === "2") {
          event.preventDefault();
          void handleGrade("remember");
        }
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setShowMeaning((current) => !current);
        return;
      }

      if (!showMeaning) {
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        void handleGrade("forgot");
        return;
      }

      if (event.key === "2") {
        event.preventDefault();
        void handleGrade("remember");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentWord,
    handleGrade,
    handleTypingSubmit,
    isSubmittingGrade,
    isTypingMode,
    showMeaning,
    typingResult,
  ]);

  const showReviewSession =
    !isLoading && !error && !isEmpty && Boolean(currentWord);

  return (
    <PageShell>
      <Panel className="mx-auto flex min-h-full w-full max-w-4xl flex-col p-4 lg:p-16">
        <div className="mb-8 flex justify-center">
          {userCollections.length > 0 && resolvedCollectionId ? (
            <ImportTargetCollectionSelect
              ariaLabel="Review collection"
              collections={userCollections}
              onChange={handleCollectionChange}
              value={resolvedCollectionId}
              variant="review"
            />
          ) : isLoadingCollections ? (
            <ReviewCollectionToolbarSkeleton />
          ) : null}
        </div>

        {showReviewSession && currentWord ? (
          <div className="mx-auto grid w-full max-w-3xl gap-3">
            <ReviewModeToggle mode={reviewMode} onModeChange={handleModeChange} />

            {isTypingMode ? (
              <>
                <ReviewTypingCard
                  onTypedAnswerChange={setTypedAnswer}
                  reviewedCount={reviewedCount}
                  totalWords={totalWords}
                  typedAnswer={typedAnswer}
                  typingFieldStyle={typingFieldStyle}
                  typingFieldText={typingFieldText}
                  typingInputRef={typingInputRef}
                  typingMeasureRef={typingMeasureRef}
                  typingResult={typingResult}
                  word={currentWord}
                />
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {!typingResult ? (
                    <Shortcut command="Enter" label="Check" />
                  ) : (
                    <>
                      <button
                        className="inline-flex items-center gap-1 text-muted-foreground disabled:opacity-50"
                        disabled={isSubmittingGrade}
                        onClick={() => void handleGrade("forgot")}
                        type="button"
                      >
                        <Key>1</Key>
                        <span>Forgot</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-1 font-semibold text-foreground disabled:opacity-50"
                        disabled={isSubmittingGrade}
                        onClick={() => void handleGrade("remember")}
                        type="button"
                      >
                        <Key>2</Key>
                        <span>Remember</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <ReviewCard
                key={resolvedCollectionId}
                isSubmitting={isSubmittingGrade}
                onGrade={handleGrade}
                onToggleMeaning={() => setShowMeaning((current) => !current)}
                reviewedCount={reviewedCount}
                showMeaning={showMeaning}
                totalWords={totalWords}
                word={currentWord}
              />
            )}
          </div>
        ) : (
          <ReviewStateBlock
            error={error}
            isEmpty={isEmpty}
            isLoading={isLoading || isLoadingCollections || !resolvedCollectionId}
            onRetry={reload}
          />
        )}
      </Panel>
    </PageShell>
  );
}

function Shortcut({ command, label }: { command: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Key>{command}</Key>
      <span>{label}</span>
    </span>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}

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
import { ReviewCard, ReviewStateBlock } from "@/features/review/components";
import { ReviewCollectionToolbarSkeleton } from "@/features/review/components/ReviewCollectionToolbarSkeleton";
import { useReviewQueue } from "@/features/review/hooks/useReviewQueue";
import type { ReviewGrade } from "@/features/review/lib/reviewSchedule";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

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
    remainingWords,
    reload,
    totalWords,
  } = useReviewQueue({
    collectionId: resolvedCollectionId,
    isAuthenticated,
    userId: user?.id ?? null,
  });

  const handleCollectionChange = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setShowMeaning(false);
  }, []);

  const handleGrade = useCallback(async (grade: ReviewGrade) => {
    if (!showMeaning) {
      return;
    }

    await gradeCurrentWord(grade);
    setShowMeaning(false);
  }, [gradeCurrentWord, showMeaning]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!currentWord || isSubmittingGrade) {
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
  }, [currentWord, handleGrade, isSubmittingGrade, showMeaning]);

  return (
    <PageShell className="bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--foreground)_9%,transparent),transparent_30rem)]">
      <Panel className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">
              Spaced repetition
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-none tracking-tighter sm:text-5xl lg:text-6xl">
              Recall first. Check after.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Say the meaning out loud, reveal the card, then grade the answer.
              Space toggles the answer. Keys 1 and 2 grade it.
            </p>
          </div>

          <div className="lg:justify-self-end">
            {userCollections.length > 0 && resolvedCollectionId ? (
              <div className="grid gap-2 rounded-2xl border border-border bg-background/80 p-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Review list
                </p>
                <ImportTargetCollectionSelect
                  ariaLabel="Review collection"
                  collections={userCollections}
                  onChange={handleCollectionChange}
                  value={resolvedCollectionId}
                  variant="toolbar"
                />
              </div>
            ) : isLoadingCollections ? (
              <ReviewCollectionToolbarSkeleton />
            ) : null}
          </div>
        </div>

        {isLoading || error || isEmpty || !currentWord ? (
          <ReviewStateBlock
            error={error}
            isEmpty={isEmpty}
            isLoading={isLoading || isLoadingCollections || !resolvedCollectionId}
            onRetry={reload}
          />
        ) : (
          <ReviewCard
            key={resolvedCollectionId}
            isSubmitting={isSubmittingGrade}
            onGrade={handleGrade}
            onToggleMeaning={() => setShowMeaning((current) => !current)}
            remainingWords={remainingWords}
            showMeaning={showMeaning}
            totalWords={totalWords}
            word={currentWord}
          />
        )}
      </Panel>
    </PageShell>
  );
}

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
    reload,
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
    <PageShell>
      <Panel>
        {userCollections.length > 0 && resolvedCollectionId ? (
          <div className="mb-4 px-4">
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
            showMeaning={showMeaning}
            word={currentWord}
          />
        )}

      </Panel>
    </PageShell>
  );
}

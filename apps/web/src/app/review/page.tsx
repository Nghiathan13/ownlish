"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  getDefaultUserCollection,
  getUserOwnedCollections,
} from "@/entities/collection/lib/collectionDisplay";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  ReviewCategorySelect,
  ReviewModeToggle,
  ReviewStateBlock,
  ReviewStudySession,
  ReviewUserCollectionNavigation,
  ReviewWorkspace,
  ReviewWorkspaceRow,
} from "@/features/review/components";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import { useReviewMode, ReviewModeProvider } from "@/features/review/hooks/useReviewMode";
import { toReviewStudyWord } from "@/features/review/model/reviewStudyWord";
import { useReviewQueue } from "@/features/review/hooks/useReviewQueue";

export default function ReviewPage() {
  return (
    <RequireAuth>
      <ReviewModeProvider>
        <ReviewPageContent />
      </ReviewModeProvider>
    </RequireAuth>
  );
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const collectionIdFromUrl = searchParams.get("collectionId");
  const { status, user } = useAuthSession();
  const { mode, setMode } = useReviewMode();
  const isAuthenticated = isAuthenticatedStatus(status);
  const { collections, isLoadingCollections } = useCollectionsListQuery({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const userCollections = useMemo(() => getUserOwnedCollections(collections), [collections]);
  const defaultCollection = useMemo(
    () => getDefaultUserCollection(collections),
    [collections],
  );
  const selectedCollectionId = useMemo(() => {
    if (!collectionIdFromUrl) return null;

    return userCollections.some((collection) => collection.id === collectionIdFromUrl)
      ? collectionIdFromUrl
      : null;
  }, [collectionIdFromUrl, userCollections]);
  const collectionId = selectedCollectionId ?? defaultCollection?.id ?? null;
  const review = useReviewQueue({
    collectionId,
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const currentWord = review.currentWord;
  const navigation = (
    <ReviewUserCollectionNavigation
      activeCollectionId={collectionId}
      collections={userCollections}
      isLoading={isLoadingCollections}
    />
  );

  return (
    <ReviewWorkspace header={<ReviewCategorySelect activeCategory="user" />}>
      <ReviewWorkspaceRow
        navigation={navigation}
        rail={
          <ReviewModeToggle
            mode={mode}
            onModeChange={setMode}
            orientation="vertical"
          />
        }
      >
        {currentWord && !review.isLoading && !review.isEmpty ? (
          <ReviewStudySession
            disableGood
            disableHard
            error={review.error}
            errorHint="Choose Again or Easy to retry."
            isSubmitting={review.isSubmittingGrade}
            key={currentWord.id}
            mode={mode}
            onAgain={() => void review.gradeCurrentWord("forgot")}
            onEasy={() => void review.gradeCurrentWord("remember")}
            onGood={() => {}}
            onHard={() => {}}
            reviewedCount={review.reviewedCount}
            totalWords={review.totalWords}
            word={toReviewStudyWord(currentWord)}
          />
        ) : (
          <ReviewStateBlock
            error={review.error}
            isEmpty={review.isEmpty}
            isLoading={review.isLoading || isLoadingCollections || !collectionId}
            onRetry={review.reload}
          />
        )}
      </ReviewWorkspaceRow>
    </ReviewWorkspace>
  );
}

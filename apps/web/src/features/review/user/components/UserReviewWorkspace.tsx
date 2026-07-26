"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { CollectionCategory } from "@/entities/collection/lib/collectionDisplay";
import {
  getDefaultUserCollection,
  getUserOwnedCollections,
} from "@/entities/collection/lib/collectionDisplay";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import {
  ReviewCategorySelect,
  ReviewModeToggle,
  ReviewStateBlock,
  ReviewStudySession,
  ReviewUserCollectionNavigation,
  ReviewWorkspace,
  ReviewWorkspaceRow,
} from "@/features/review/components";
import { useReviewMode } from "@/features/review/hooks/useReviewMode";
import { useReviewQueue } from "@/features/review/hooks/useReviewQueue";
import { toReviewStudyWord } from "@/features/review/model/reviewStudyWord";

type UserReviewWorkspaceProps = {
  onCategoryChange: (category: CollectionCategory) => void;
};

export function UserReviewWorkspace({ onCategoryChange }: UserReviewWorkspaceProps) {
  const { status, user } = useAuthSession();
  const searchParams = useSearchParams();
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
    const collectionIdFromUrl = searchParams.get("collectionId");
    if (!collectionIdFromUrl) {
      return null;
    }

    return userCollections.some((collection) => collection.id === collectionIdFromUrl)
      ? collectionIdFromUrl
      : null;
  }, [searchParams, userCollections]);
  const collectionId = selectedCollectionId ?? defaultCollection?.id ?? null;
  const review = useReviewQueue({
    collectionId,
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const currentWord = review.currentWord;

  return (
    <ReviewWorkspace
      header={
        <ReviewCategorySelect
          activeCategory="user"
          onCategoryChange={onCategoryChange}
        />
      }
    >
      <ReviewWorkspaceRow
        navigation={
          <ReviewUserCollectionNavigation
            activeCollectionId={collectionId}
            collections={userCollections}
            isLoading={isLoadingCollections}
          />
        }
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
            error={review.error}
            errorHint="Choose Again or Easy to retry."
            isSubmitting={review.isSubmittingGrade}
            key={`${mode}:${currentWord.id}`}
            level={currentWord.level}
            mode={mode}
            onAgain={() => void review.gradeCurrentWord("FORGET")}
            onEasy={() => void review.gradeCurrentWord("EASY")}
            onGood={() => void review.gradeCurrentWord("GOOD")}
            onHard={() => void review.gradeCurrentWord("HARD")}
            onMaster={() => void review.gradeCurrentWord("MASTER")}
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

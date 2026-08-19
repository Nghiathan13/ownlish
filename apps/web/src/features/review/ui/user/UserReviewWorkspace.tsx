"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  getDefaultUserCollection,
  getUserOwnedCollections,
  useCollectionsListQuery,
} from "@/entities/collection";
import {
  getStoredAccessToken,
  isAuthenticatedStatus,
  runAuthenticatedRequest,
  useAuthSession,
} from "@/entities/session";
import {
  LEARNING_ACTIVITY_TYPES,
  useLearningActivityTracker,
} from "@/entities/learning-activity";
import { toReviewStudyWord } from "../../model/reviewStudyWord";
import { useReviewMode } from "../../model/useReviewMode";
import { useReviewQueue } from "../../model/useReviewQueue";
import { ReviewWorkspaceRow } from "../ReviewWorkspace";
import { ReviewModeCardStack } from "../study/ReviewModeCardStack";
import { ReviewStateBlock } from "../study/ReviewStateBlock";
import { ReviewStudySession } from "../study/ReviewStudySession";
import { ReviewUserCollectionNavigation } from "./ReviewUserCollectionNavigation";

export function UserReviewWorkspace() {
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
  useLearningActivityTracker({
    activityType: LEARNING_ACTIVITY_TYPES.VOCABULARY_REVIEW,
    getAccessToken: getStoredAccessToken,
    runAuthenticatedRequest,
    enabled:
      isAuthenticated &&
      !review.isLoading &&
      !review.isEmpty &&
      Boolean(currentWord),
  });

  return (
    <ReviewWorkspaceRow
      navigation={
        <ReviewUserCollectionNavigation
          activeCollectionId={collectionId}
          collections={userCollections}
          isLoading={isLoadingCollections}
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
          onModeChange={setMode}
          reviewedCount={review.reviewedCount}
          totalWords={review.totalWords}
          word={toReviewStudyWord(currentWord)}
        />
      ) : (
        <ReviewModeCardStack mode={mode} onModeChange={setMode}>
          <ReviewStateBlock
            error={review.error}
            isEmpty={review.isEmpty}
            isLoading={review.isLoading || isLoadingCollections || !collectionId}
            onRetry={review.reload}
          />
        </ReviewModeCardStack>
      )}
    </ReviewWorkspaceRow>
  );
}

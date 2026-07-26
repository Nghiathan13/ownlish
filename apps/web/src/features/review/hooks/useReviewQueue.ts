"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDueReviewWords,
  updateVocabReview,
  type ReviewRating,
  type UserVocabularyEntry,
} from "@/entities/vocab/api/vocab";
import {
  getReviewQueueQueryKey,
  optimisticallyRemoveFromReviewQueue,
  restoreReviewQueue,
} from "@/entities/vocab/lib/reviewQueueCache";
import { getVocabUserQueryKey } from "@/entities/vocab/lib/vocabCache";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";
import { randomizeReviewQueue } from "../lib/randomizeReviewQueue";

type UseReviewQueueParams = {
  collectionId: string | null;
  isAuthenticated: boolean;
  userId: string | null;
};

type ReviewOrder = {
  collectionId: string | null;
  ranks: Map<string, number>;
};

export function useReviewQueue({
  collectionId,
  isAuthenticated,
  userId,
}: UseReviewQueueParams) {
  const queryClient = useQueryClient();
  const [reviewedCount, setReviewedCount] = useState(0);
  const [trackedCollectionId, setTrackedCollectionId] = useState(collectionId);
  const [reviewOrder, setReviewOrder] = useState<ReviewOrder>(() => ({
    collectionId,
    ranks: new Map<string, number>(),
  }));

  if (trackedCollectionId !== collectionId) {
    setTrackedCollectionId(collectionId);
    setReviewedCount(0);
  }

  if (reviewOrder.collectionId !== collectionId) {
    setReviewOrder({ collectionId, ranks: new Map<string, number>() });
  }

  const orderQueue = useCallback(
    (queue: Awaited<ReturnType<typeof listDueReviewWords>>) => ({
      ...queue,
      items: randomizeReviewQueue(queue.items, reviewOrder.ranks),
    }),
    [reviewOrder.ranks],
  );

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: getReviewQueueQueryKey(userId, collectionId),
    queryFn: async ({ signal }) => {
      return runAuthenticatedRequest({
        request: (token) =>
          listDueReviewWords(token, {
            collectionId: collectionId as string,
            offset: 0,
            signal,
          }),
      });
    },
    enabled: isAuthenticated && Boolean(userId) && Boolean(collectionId),
    select: orderQueue,
  });

  const reviewItems = data?.items;
  const currentWord = reviewItems?.[0] ?? null;
  const totalWords = data?.meta.total ?? 0;

  const loadError = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Cannot load review words."
    : null;

  const {
    mutateAsync: gradeWord,
    error: gradeError,
    isPending: isSubmittingGrade,
  } = useMutation({
    mutationFn: ({ word, rating }: { word: UserVocabularyEntry; rating: ReviewRating }) => {
      return runAuthenticatedRequest({
        request: (token) =>
          updateVocabReview(token, word.id, { rating }),
      });
    },
    onMutate: async ({ word }) => {
      setReviewedCount((current) => current + 1);

      const previousQueue = await optimisticallyRemoveFromReviewQueue(
        queryClient,
        userId,
        collectionId,
        word.id,
        { decrementTotal: false },
      );

      return { previousQueue };
    },
    onError: (error, variables, context) => {
      setReviewedCount((current) => Math.max(0, current - 1));
      restoreReviewQueue(
        queryClient,
        userId,
        collectionId,
        context?.previousQueue,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getVocabUserQueryKey(userId) });
      queryClient.invalidateQueries({
        queryKey: getVocabStatsQueryKey(userId, collectionId),
      });
    },
  });

  const reload = useCallback(() => {
    setReviewedCount(0);
    setReviewOrder({ collectionId, ranks: new Map<string, number>() });
    queryClient.invalidateQueries({
      queryKey: getReviewQueueQueryKey(userId, collectionId),
    });
  }, [collectionId, queryClient, userId]);

  const gradeCurrentWord = useCallback(
    (rating: ReviewRating) => {
      if (!currentWord) return Promise.resolve();
      return gradeWord({ word: currentWord, rating });
    },
    [currentWord, gradeWord],
  );

  const mutationError = gradeError
    ? gradeError instanceof ApiError
      ? gradeError.message
      : "Cannot update review."
    : null;

  return {
    currentWord,
    error: loadError || mutationError,
    gradeCurrentWord,
    isEmpty: (reviewItems?.length ?? 0) === 0,
    isLoading,
    isSubmittingGrade,
    reload,
    reviewedCount,
    totalWords,
  };
}

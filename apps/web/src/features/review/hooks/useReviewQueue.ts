"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDueReviewWords,
  updateVocabReview,
  type VocabReviewItem,
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
import { buildReviewUpdate, type ReviewGrade } from "../lib/reviewSchedule";

type UseReviewQueueParams = {
  collectionId: string | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function useReviewQueue({
  collectionId,
  isAuthenticated,
  userId,
}: UseReviewQueueParams) {
  const queryClient = useQueryClient();

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
    mutationFn: ({ word, grade }: { word: VocabReviewItem; grade: ReviewGrade }) => {
      return runAuthenticatedRequest({
        request: (token) =>
          updateVocabReview(token, word.id, buildReviewUpdate(word, grade)),
      });
    },
    onMutate: async ({ word }) => {
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
    queryClient.invalidateQueries({
      queryKey: getReviewQueueQueryKey(userId, collectionId),
    });
  }, [collectionId, queryClient, userId]);

  const gradeCurrentWord = useCallback(
    (grade: ReviewGrade) => {
      if (!currentWord) return Promise.resolve();
      return gradeWord({ word: currentWord, grade });
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
    remainingWords: reviewItems?.length ?? 0,
    reload,
    totalWords,
  };
}

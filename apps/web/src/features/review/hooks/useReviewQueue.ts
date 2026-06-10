"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDueReviewWords,
  updateVocabReview,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import {
  getReviewQueueQueryKey,
  optimisticallyRemoveFromReviewQueue,
  restoreReviewQueue,
} from "@/entities/vocab/lib/reviewQueueCache";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";
import { buildReviewUpdate, type ReviewGrade } from "../lib/reviewSchedule";

type UseReviewQueueParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
};

export function useReviewQueue({
  accessToken,
  clearSession,
  isAuthenticated,
}: UseReviewQueueParams) {
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: getReviewQueueQueryKey(accessToken),
    queryFn: async ({ signal }) => {
      if (!accessToken) throw new Error("No access token");
      try {
        return await listDueReviewWords(accessToken, {
          offset: 0,
          signal,
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearSession();
        }
        throw error;
      }
    },
    enabled: isAuthenticated && Boolean(accessToken),
  });

  const reviewWords = data?.items ?? [];
  const totalWords = data?.meta.total ?? 0;

  const loadError = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Cannot load review words."
    : null;

  const gradeMutation = useMutation({
    mutationFn: ({ word, grade }: { word: VocabWord; grade: ReviewGrade }) => {
      if (!accessToken) throw new Error("No access token");
      return updateVocabReview(
        accessToken,
        word.id,
        buildReviewUpdate(word, grade)
      );
    },
    onMutate: async ({ word }) => {
      const previousQueue = await optimisticallyRemoveFromReviewQueue(
        queryClient,
        accessToken,
        word.id,
      );

      return { previousQueue };
    },
    onError: (error, variables, context) => {
      restoreReviewQueue(queryClient, accessToken, context?.previousQueue);
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getReviewQueueQueryKey(accessToken) });
  }, [queryClient, accessToken]);

  const gradeCurrentWord = useCallback(
    (grade: ReviewGrade) => {
      const currentWord = reviewWords[0];
      if (!currentWord) return Promise.resolve();
      return gradeMutation.mutateAsync({ word: currentWord, grade });
    },
    [reviewWords, gradeMutation],
  );

  const mutationError = gradeMutation.error
    ? gradeMutation.error instanceof ApiError
      ? gradeMutation.error.message
      : "Cannot update review."
    : null;

  return {
    currentWord: reviewWords[0] ?? null,
    error: loadError || mutationError,
    gradeCurrentWord,
    isEmpty: reviewWords.length === 0,
    isLoading,
    isSubmittingGrade: gradeMutation.isPending,
    remainingWords: reviewWords.length,
    reload,
    totalWords,
  };
}

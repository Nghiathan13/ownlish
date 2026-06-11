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
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";
import { buildReviewUpdate, type ReviewGrade } from "../lib/reviewSchedule";

type UseReviewQueueParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  userId: string | null;
};

export function useReviewQueue({
  accessToken,
  clearSession,
  isAuthenticated,
  userId,
}: UseReviewQueueParams) {
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: getReviewQueueQueryKey(userId),
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
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(userId),
  });

  const reviewWords = data?.items;
  const currentWord = reviewWords?.[0] ?? null;
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
        userId,
        word.id,
        { decrementTotal: false },
      );

      return { previousQueue };
    },
    onError: (error, variables, context) => {
      restoreReviewQueue(queryClient, userId, context?.previousQueue);
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
      queryClient.invalidateQueries({ queryKey: getVocabStatsQueryKey(userId) });
    },
  });

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getReviewQueueQueryKey(userId) });
  }, [queryClient, userId]);

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
    isEmpty: (reviewWords?.length ?? 0) === 0,
    isLoading,
    isSubmittingGrade,
    remainingWords: reviewWords?.length ?? 0,
    reload,
    totalWords,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listDueReviewWords,
  updateVocabReview,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import { ApiError, isAbortError, isUnauthorizedError } from "@/shared/api/http";
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
  const [reviewWords, setReviewWords] = useState<VocabWord[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(
    async (signal?: AbortSignal) => {
      if (!accessToken || signal?.aborted) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listDueReviewWords(accessToken, {
          offset: 0,
          signal,
        });

        if (signal?.aborted) {
          return;
        }

        setReviewWords(response.items);
        setTotalWords(response.meta.total);
      } catch (caughtError) {
        if (signal?.aborted || isAbortError(caughtError)) {
          return;
        }

        if (isUnauthorizedError(caughtError)) {
          clearSession();
          return;
        }

        setReviewWords([]);
        setTotalWords(0);
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : "Cannot load review words.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, clearSession],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const abortController = new AbortController();

    queueMicrotask(() => {
      if (!abortController.signal.aborted) {
        void loadQueue(abortController.signal);
      }
    });

    return () => {
      abortController.abort();
    };
  }, [isAuthenticated, loadQueue]);

  const reload = useCallback(() => {
    void loadQueue();
  }, [loadQueue]);

  async function gradeCurrentWord(grade: ReviewGrade) {
    const currentWord = reviewWords[0];

    if (!accessToken || !currentWord) {
      return;
    }

    setIsSubmittingGrade(true);
    setError(null);

    try {
      await updateVocabReview(
        accessToken,
        currentWord.id,
        buildReviewUpdate(currentWord, grade),
      );

      setReviewWords((currentWords) =>
        currentWords.filter((word) => word.id !== currentWord.id),
      );
      setTotalWords((currentTotal) => Math.max(0, currentTotal - 1));
    } catch (caughtError) {
      if (isUnauthorizedError(caughtError)) {
        clearSession();
        return;
      }

      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Cannot update review.",
      );
    } finally {
      setIsSubmittingGrade(false);
    }
  }

  return {
    currentWord: reviewWords[0] ?? null,
    error,
    gradeCurrentWord,
    isEmpty: reviewWords.length === 0,
    isLoading,
    isSubmittingGrade,
    remainingWords: reviewWords.length,
    reload,
    totalWords,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDifficultReviewWords,
  type DifficultReviewWordsSource,
} from "@/entities/review/api/difficultReviewWords";
import { getDifficultReviewWordsQueryKey } from "@/entities/review/lib/difficultReviewWordsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

export function useDifficultReviewWords({
  enabled,
  isAuthenticated,
  source = "collection",
  userId,
}: {
  enabled: boolean;
  isAuthenticated: boolean;
  source?: DifficultReviewWordsSource;
  userId: string | null;
}) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: getDifficultReviewWordsQueryKey(userId, source),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) =>
          getDifficultReviewWords(token, { signal, source }),
      }),
    enabled: enabled && isAuthenticated && Boolean(userId),
  });

  return {
    error:
      error instanceof ApiError
        ? error.message
        : error
          ? "Cannot load difficult words."
          : null,
    isLoading,
    reload: refetch,
    words: data ?? [],
  };
}

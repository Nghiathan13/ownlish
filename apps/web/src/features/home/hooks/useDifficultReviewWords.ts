"use client";

import { useQuery } from "@tanstack/react-query";
import { getDifficultReviewWords } from "@/entities/review/api/difficultReviewWords";
import { getDifficultReviewWordsQueryKey } from "@/entities/review/lib/difficultReviewWordsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

export function useDifficultReviewWords({
  enabled,
  isAuthenticated,
  userId,
}: {
  enabled: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: getDifficultReviewWordsQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getDifficultReviewWords(token, { signal }),
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

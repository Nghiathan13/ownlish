"use client";

import { useQuery } from "@tanstack/react-query";
import { getVocabStats } from "@/entities/vocab/api/vocab";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { ApiError } from "@/shared/api/http";

type UseVocabStatsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  userId: string | null;
};

export function useVocabStats({
  accessToken,
  clearSession,
  isAuthenticated,
  userId,
}: UseVocabStatsParams) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: getVocabStatsQueryKey(userId),
    queryFn: async ({ signal }) => {
      return runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => getVocabStats(token, { signal }),
      });
    },
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(userId),
  });

  return {
    error:
      error instanceof ApiError
        ? error.message
        : error
          ? "Cannot load dashboard."
          : null,
    isLoading,
    reload: refetch,
    stats: data ?? null,
  };
}

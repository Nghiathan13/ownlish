"use client";

import { useQuery } from "@tanstack/react-query";
import { getVocabStats } from "@/entities/vocab/api/vocab";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

type UseVocabStatsParams = {
  collectionId: string | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function useVocabStats({
  collectionId,
  isAuthenticated,
  userId,
}: UseVocabStatsParams) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: getVocabStatsQueryKey(userId, collectionId),
    queryFn: async ({ signal }) => {
      return runAuthenticatedRequest({
        request: (token) =>
          getVocabStats(token, {
            collectionId: collectionId as string,
            signal,
          }),
      });
    },
    enabled: isAuthenticated && Boolean(userId) && Boolean(collectionId),
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

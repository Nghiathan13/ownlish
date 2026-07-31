"use client";

import { useQuery } from "@tanstack/react-query";
import { getVocabStats } from "@/entities/vocab/api/vocab";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

export type VocabStatsCollectionId = "all" | string;

type UseVocabStatsParams = {
  collectionId: VocabStatsCollectionId | null;
  enabled: boolean;
  isAuthenticated: boolean;
  userId: string | null;
};

export function useVocabStats({
  collectionId,
  enabled,
  isAuthenticated,
  userId,
}: UseVocabStatsParams) {
  const statsCollectionId =
    collectionId == null || collectionId === "all" ? null : collectionId;
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: getVocabStatsQueryKey(userId, statsCollectionId),
    queryFn: async ({ signal }) => {
      return runAuthenticatedRequest({
        request: (token) =>
          getVocabStats(token, {
            collectionId: statsCollectionId ?? undefined,
            signal,
          }),
      });
    },
    enabled:
      enabled &&
      isAuthenticated &&
      Boolean(userId) &&
      collectionId != null,
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

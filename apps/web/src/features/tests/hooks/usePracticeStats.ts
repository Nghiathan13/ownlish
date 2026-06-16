"use client";

import { useQuery } from "@tanstack/react-query";
import { getPracticeStats } from "@/features/tests/api/testsApi";
import type { PracticeStats } from "@/features/tests/api/types";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

export function getPracticeStatsQueryKey(testId: number) {
  return ["practice-stats", testId] as const;
}

type UsePracticeStatsParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  enabled: boolean;
};

export function usePracticeStats({
  accessToken,
  clearSession,
  testId,
  enabled,
}: UsePracticeStatsParams) {
  const query = useQuery({
    queryKey: getPracticeStatsQueryKey(testId),
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => getPracticeStats(token, testId),
      }),
    enabled: enabled && Boolean(accessToken),
    staleTime: 30_000,
  });

  return {
    stats: query.data ?? null,
    isLoadingStats: query.isLoading,
    statsError: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Cannot load practice stats."
      : null,
    reloadStats: query.refetch,
  };
}

export function getPartStats(
  stats: PracticeStats | null,
  partNumber: number,
) {
  return stats?.parts.find((part) => part.partNumber === partNumber) ?? null;
}

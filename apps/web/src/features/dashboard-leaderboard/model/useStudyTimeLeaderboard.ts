"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getStudyTimeLeaderboard,
  type StudyTimeLeaderboardPeriod,
} from "@/entities/leaderboard";
import { runAuthenticatedRequest } from "@/entities/session";
import { ApiError } from "@/shared/api";

export function useStudyTimeLeaderboard({
  anchor,
  enabled,
  isAuthenticated,
  period,
  userId,
}: {
  anchor: string | null;
  enabled: boolean;
  isAuthenticated: boolean;
  period: StudyTimeLeaderboardPeriod;
  userId: string | null;
}) {
  const query = useQuery({
    queryKey: ["leaderboard", "study-time", period, anchor],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) =>
          getStudyTimeLeaderboard(token, { anchor, period, signal }),
      }),
    enabled: enabled && isAuthenticated && Boolean(userId),
  });

  return {
    leaderboard: query.data ?? null,
    error:
      query.error instanceof ApiError
        ? query.error.message
        : query.error
          ? "Cannot load leaderboard."
          : null,
    isLoading: query.isLoading,
    reload: query.refetch,
  };
}

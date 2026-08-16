"use client";

import { useQuery } from "@tanstack/react-query";
import { getExperienceLeaderboard } from "@/entities/leaderboard";
import { runAuthenticatedRequest } from "@/entities/session";
import { ApiError } from "@/shared/api";

export function useExperienceLeaderboard({
  enabled,
  isAuthenticated,
  userId,
}: {
  enabled: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const query = useQuery({
    queryKey: ["leaderboard", "experience"],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getExperienceLeaderboard(token, signal),
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

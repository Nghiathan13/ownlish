"use client";

import { useQuery } from "@tanstack/react-query";
import { getExperienceSummary } from "@/entities/experience";
import { runAuthenticatedRequest } from "@/entities/session";
import { ApiError } from "@/shared/api";

export function useExperienceSummary({
  enabled,
  isAuthenticated,
  userId,
}: {
  enabled: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const query = useQuery({
    queryKey: ["experience", "summary", userId],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getExperienceSummary(token, signal),
      }),
    enabled: enabled && isAuthenticated && Boolean(userId),
  });

  return {
    error:
      query.error instanceof ApiError
        ? query.error.message
        : query.error
          ? "Cannot load experience."
          : null,
    isLoading: query.isLoading,
    totalXp: query.data?.totalXp ?? 0,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getOxfordProgressSummary } from "@/entities/collection";
import { getOxfordProgressSummaryQueryKey } from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import type { OxfordBand } from "@/entities/collection";
import { ApiError } from "@/shared/api";

export type OxfordProgressBand = "all" | OxfordBand;

export function useOxfordProgressSummary({
  band = "all",
  enabled,
  isAuthenticated,
  userId,
}: {
  band?: OxfordProgressBand;
  enabled: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: getOxfordProgressSummaryQueryKey(userId, band),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) =>
          getOxfordProgressSummary(token, {
            band: band === "all" ? undefined : band,
            signal,
          }),
      }),
    enabled: enabled && isAuthenticated && Boolean(userId),
  });

  return {
    error:
      error instanceof ApiError
        ? error.message
        : error
          ? "Cannot load Oxford progress."
          : null,
    isLoading,
    reload: refetch,
    summary: data ?? null,
  };
}

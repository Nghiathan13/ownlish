"use client";

import { useQuery } from "@tanstack/react-query";
import { listPartPracticeSummaries } from "@/entities/toeic/api/partPractice";
import { getPartPracticeOverviewQueryKey } from "@/entities/toeic-runtime/model/cache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

type UseDashboardPartPracticeParams = {
  isAuthenticated: boolean;
  userId: string | null;
};

export function useDashboardPartPractice({
  isAuthenticated,
  userId,
}: UseDashboardPartPracticeParams) {
  const query = useQuery({
    queryKey: getPartPracticeOverviewQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listPartPracticeSummaries(token, { signal }),
      }),
    enabled: isAuthenticated && Boolean(userId),
  });

  return {
    error:
      query.error instanceof ApiError
        ? query.error.message
        : query.error
          ? "Cannot load Part Practice progress."
          : null,
    isLoading: query.isLoading,
    reload: query.refetch,
    summaries: query.data ?? [],
  };
}

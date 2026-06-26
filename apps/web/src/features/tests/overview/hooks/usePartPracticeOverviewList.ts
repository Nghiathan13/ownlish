"use client";

import { useQuery } from "@tanstack/react-query";
import { listPartPracticeSummaries } from "@/entities/toeic/api/partPractice";
import { getPartPracticeOverviewQueryKey } from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";

type UsePartPracticeOverviewListParams = {
  isAuthenticated: boolean;
  userId: string | null;
};

export function usePartPracticeOverviewList({
  isAuthenticated,
  userId,
}: UsePartPracticeOverviewListParams) {
  const query = useQuery({
    queryKey: getPartPracticeOverviewQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listPartPracticeSummaries(token, { signal }),
      }),
    enabled: isAuthenticated,
  });

  return {
    summaries: query.data ?? [],
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot load part practice summary."),
    reload: query.refetch,
  };
}

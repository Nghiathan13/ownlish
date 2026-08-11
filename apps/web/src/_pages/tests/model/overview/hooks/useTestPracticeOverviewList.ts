"use client";

import { useQuery } from "@tanstack/react-query";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import { listRuntimeTestPracticeRuns } from "@/entities/toeic-runtime";
import { getRuntimeTestPracticeOverviewQueryKey } from "@/entities/toeic-runtime";
import { runAuthenticatedRequest } from "@/entities/session";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

type UseTestPracticeOverviewListParams = {
  isAuthenticated: boolean;
  userId: string | null;
  source: ToeicCatalogSource | undefined;
};

export function useTestPracticeOverviewList({
  isAuthenticated,
  userId,
  source,
}: UseTestPracticeOverviewListParams) {
  const query = useQuery({
    queryKey: getRuntimeTestPracticeOverviewQueryKey(userId),
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) => listRuntimeTestPracticeRuns(token),
      }),
    enabled: isAuthenticated && Boolean(source),
  });

  return {
    progress: query.data ?? [],
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot load test progress."),
    reload: query.refetch,
  };
}

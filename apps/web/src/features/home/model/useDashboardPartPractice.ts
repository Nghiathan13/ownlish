"use client";

import { useQuery } from "@tanstack/react-query";
import { listRuntimePartPracticeRuns } from "@/entities/toeic-runtime";
import { getPartPracticeOverviewQueryKey } from "@/entities/toeic-runtime";
import { runAuthenticatedRequest } from "@/entities/session";
import { ApiError } from "@/shared/api";

type UseDashboardPartPracticeParams = {
  isAuthenticated: boolean;
  userId: string | null;
};

export type DashboardPartPracticeSummary = {
  partNumber: number;
  answered: number;
  correct: number;
  wrong: number;
};

export function useDashboardPartPractice({
  isAuthenticated,
  userId,
}: UseDashboardPartPracticeParams) {
  const query = useQuery({
    queryKey: getPartPracticeOverviewQueryKey(userId),
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) =>
          listRuntimePartPracticeRuns(token).then((items) =>
            items.map(
              (item): DashboardPartPracticeSummary => ({
                partNumber: item.partNumber,
                answered: item.answeredCount,
                correct: item.correctCount,
                wrong: item.wrongCount,
              }),
            ),
          ),
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

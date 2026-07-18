"use client";

import { useQuery } from "@tanstack/react-query";
import { getToeicCatalog } from "@/entities/toeic-catalog/api/catalog";
import { listRuntimePartPracticeRuns } from "@/entities/toeic-runtime/api/runtime";
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
    queryFn: async () => {
      const [source, progress] = await Promise.all([
        getToeicCatalog(),
        runAuthenticatedRequest({
          request: (token) => listRuntimePartPracticeRuns(token),
        }),
      ]);
      const progressByPart = new Map(
        progress.map((item) => [item.partNumber, item]),
      );

      return source.manifest.partPractice.map((part) => {
        const summary = progressByPart.get(part.number);
        return {
          partNumber: part.number,
          total: part.questionCount,
          answered: summary?.answeredCount ?? 0,
          correct: summary?.correctCount ?? 0,
          wrong: summary?.wrongCount ?? 0,
        };
      });
    },
    enabled: isAuthenticated,
  });

  return {
    summaries: query.data ?? [],
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot load part practice summary."),
    reload: query.refetch,
  };
}

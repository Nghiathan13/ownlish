"use client";

import { useQuery } from "@tanstack/react-query";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import { listRuntimePartPracticeRuns } from "@/entities/toeic-runtime/api/runtime";
import { getPartPracticeOverviewQueryKey } from "@/entities/toeic-runtime/model/cache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

type UsePartPracticeOverviewListParams = {
  isAuthenticated: boolean;
  userId: string | null;
  source: ToeicCatalogSource | undefined;
};

export function usePartPracticeOverviewList({
  isAuthenticated,
  userId,
  source,
}: UsePartPracticeOverviewListParams) {
  const query = useQuery({
    queryKey: getPartPracticeOverviewQueryKey(userId),
    queryFn: async () => {
      if (!source) {
        throw new Error("TOEIC catalog is unavailable.");
      }

      const progress = await runAuthenticatedRequest({
        request: (token) => listRuntimePartPracticeRuns(token),
      });
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
    enabled: isAuthenticated && Boolean(source),
  });

  return {
    summaries: query.data ?? [],
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot load part practice summary."),
    reload: query.refetch,
  };
}

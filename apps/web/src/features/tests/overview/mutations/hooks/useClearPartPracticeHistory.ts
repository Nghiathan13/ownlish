"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearRuntimePartPracticeRun } from "@/entities/toeic-runtime/api/runtime";
import {
  invalidateAllPartPracticeSessions,
  invalidatePartPracticeOverview,
} from "@/entities/toeic-runtime/model/cache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { clearPartPracticeGroupKeys } from "@/features/tests/shared/model/partPracticePosition";

type UseClearPartPracticeHistoryParams = {
  userId: string | null;
};

export function useClearPartPracticeHistory({
  userId,
}: UseClearPartPracticeHistoryParams) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (partNumber: number) =>
      runAuthenticatedRequest({
        request: (token) => clearRuntimePartPracticeRun(token, partNumber),
      }),
    onSuccess: async (_, partNumber) => {
      clearPartPracticeGroupKeys(partNumber);
      await Promise.all([
        invalidatePartPracticeOverview(queryClient, userId),
        invalidateAllPartPracticeSessions(queryClient),
      ]);
    },
  });

  return {
    clearHistory: mutation.mutateAsync,
    isClearing: mutation.isPending,
    clearingPartNumber: mutation.isPending ? mutation.variables ?? null : null,
  };
}

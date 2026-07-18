"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearRuntimePartPracticeRun } from "@/entities/toeic-runtime/api/runtime";
import {
  invalidateAllPartPracticeSessions,
  invalidateAllPracticeSessions,
  invalidatePartPracticeOverview,
} from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

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
    onSuccess: async () => {
      await Promise.all([
        invalidatePartPracticeOverview(queryClient, userId),
        invalidateAllPracticeSessions(queryClient),
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

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearPartPracticeHistory } from "@/entities/toeic/api/partPractice";
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
        request: (token) => clearPartPracticeHistory(token, partNumber),
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

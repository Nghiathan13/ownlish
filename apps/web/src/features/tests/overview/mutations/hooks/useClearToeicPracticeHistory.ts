"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearToeicPracticeHistory } from "@/entities/toeic/api/toeic";
import {
  invalidateAllPracticeSessions,
  invalidateToeicTestsOverview,
} from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { clearAllPracticeProgressForTest } from "@/features/tests/run/lib/practiceStorage";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";

type UseClearToeicPracticeHistoryParams = {
  userId: string | null;
  year: ToeicYear;
};

export function useClearToeicPracticeHistory({
  userId,
  year,
}: UseClearToeicPracticeHistoryParams) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (testId: number) =>
      runAuthenticatedRequest({
        request: (token) => clearToeicPracticeHistory(token, testId),
      }),
    onSuccess: (_result, testId) => {
      clearAllPracticeProgressForTest(testId);

      void Promise.all([
        invalidateToeicTestsOverview(queryClient, userId, year),
        invalidateAllPracticeSessions(queryClient),
      ]);
    },
  });

  return {
    clearHistory: mutation.mutateAsync,
    isClearing: mutation.isPending,
    clearingTestId: mutation.isPending ? mutation.variables ?? null : null,
    clearError: toQueryErrorMessage(
      mutation.error,
      "Cannot clear practice history.",
    ),
    resetClearState: mutation.reset,
  };
}

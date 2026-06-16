"use client";

import { useQuery } from "@tanstack/react-query";
import { listWrongQuestions } from "@/features/tests/api/testsApi";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

export function getWrongQuestionsQueryKey(testId: number, partNumber: number) {
  return ["wrong-questions", testId, partNumber] as const;
}

type UseWrongQuestionsParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  partNumber: number;
  enabled: boolean;
};

export function useWrongQuestions({
  accessToken,
  clearSession,
  testId,
  partNumber,
  enabled,
}: UseWrongQuestionsParams) {
  const query = useQuery({
    queryKey: getWrongQuestionsQueryKey(testId, partNumber),
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => listWrongQuestions(token, testId, partNumber),
      }),
    enabled: enabled && Boolean(accessToken),
    staleTime: 30_000,
  });

  return {
    wrongQuestions: query.data ?? [],
    isLoadingWrongQuestions: query.isLoading,
    wrongQuestionsError: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Cannot load wrong questions."
      : null,
  };
}

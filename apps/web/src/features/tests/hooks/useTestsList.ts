"use client";

import { useQuery } from "@tanstack/react-query";
import { listTests } from "@/features/tests/api/testsApi";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { ApiError } from "@/shared/api/http";

type UseTestsListParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  userId: string | null;
  year?: number;
};

export function getTestsQueryKey(userId: string | null, year: number) {
  return ["tests", { userId, year }] as const;
}

export function useTestsList({
  accessToken,
  clearSession,
  isAuthenticated,
  userId,
  year = 2026,
}: UseTestsListParams) {
  const testsQuery = useQuery({
    queryKey: getTestsQueryKey(userId, year),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => listTests(token, year, { signal }),
      }),
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(userId),
  });

  return {
    tests: testsQuery.data ?? [],
    testsError:
      testsQuery.error instanceof ApiError
        ? testsQuery.error.message
        : testsQuery.error
          ? "Cannot load tests."
          : null,
    isLoadingTests: testsQuery.isLoading,
    reloadTests: testsQuery.refetch,
  };
}

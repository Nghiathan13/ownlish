"use client";

import { useQuery } from "@tanstack/react-query";
import { listToeicTests } from "@/features/tests/overview/api/toeicTestsOverviewApi";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

type UseTestsListParams = {
  isAuthenticated: boolean;
  userId: string | null;
  year?: number;
};

export function getTestsQueryKey(userId: string | null, year: number) {
  return ["tests", { userId, year }] as const;
}

export function useTestsList({
  isAuthenticated,
  userId,
  year = 2026,
}: UseTestsListParams) {
  const testsQuery = useQuery({
    queryKey: getTestsQueryKey(userId, year),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listToeicTests(token, year, { signal }),
      }),
    enabled: isAuthenticated && Boolean(userId),
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

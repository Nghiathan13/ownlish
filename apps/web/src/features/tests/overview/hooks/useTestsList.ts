"use client";

import { useQuery } from "@tanstack/react-query";
import { listToeicTests } from "@/entities/toeic/api/toeic";
import { getToeicTestsQueryKey } from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";
import { DEFAULT_TOEIC_YEAR, type ToeicYear } from "@/features/tests/shared/constants/toeicYears";

type UseTestsListParams = {
  isAuthenticated: boolean;
  userId: string | null;
  year?: ToeicYear;
};

export { getToeicTestsQueryKey as getTestsQueryKey };

export function useTestsList({
  isAuthenticated,
  userId,
  year = DEFAULT_TOEIC_YEAR,
}: UseTestsListParams) {
  const testsQuery = useQuery({
    queryKey: getToeicTestsQueryKey(userId, year),
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { listToeicTestYears } from "@/entities/toeic/api/toeic";
import { getToeicTestYearsQueryKey } from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getToeicTestYears } from "@/features/tests/overview/lib/toeicTestYears";
import { ApiError } from "@/shared/api/http";

type UseAvailableToeicYearsParams = {
  isAuthenticated: boolean;
  userId: string | null;
};

export function useAvailableToeicYears({
  isAuthenticated,
  userId,
}: UseAvailableToeicYearsParams) {
  const yearsQuery = useQuery({
    queryKey: getToeicTestYearsQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listToeicTestYears(token, { signal }),
      }),
    enabled: isAuthenticated && Boolean(userId),
    select: getToeicTestYears,
  });

  return {
    availableYears: yearsQuery.data ?? [],
    isLoadingYears: yearsQuery.isLoading,
    yearsError:
      yearsQuery.error instanceof ApiError
        ? yearsQuery.error.message
        : yearsQuery.error
          ? "Cannot load test years."
          : null,
    reloadYears: yearsQuery.refetch,
  };
}

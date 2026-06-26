"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminToeicTestRaw } from "@/features/admin/toeic/api/adminToeicTests";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

export function getAdminToeicTestDetailQueryKey(testId: number) {
  return ["admin-toeic-test", testId] as const;
}

type UseAdminToeicTestDetailQueryParams = {
  enabled: boolean;
  testId: number;
};

export function useAdminToeicTestDetailQuery({
  enabled,
  testId,
}: UseAdminToeicTestDetailQueryParams) {
  const query = useQuery({
    queryKey: getAdminToeicTestDetailQueryKey(testId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getAdminToeicTestRaw({ token, testId, signal }),
      }),
    enabled: enabled && testId > 0,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  };
}

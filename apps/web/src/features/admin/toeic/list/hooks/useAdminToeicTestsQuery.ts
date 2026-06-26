"use client";

import { useQuery } from "@tanstack/react-query";
import { listAdminToeicTests } from "@/features/admin/toeic/api/adminToeicTests";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

export function getAdminToeicTestsQueryKey() {
  return ["admin-toeic-tests"] as const;
}

type UseAdminToeicTestsQueryParams = {
  enabled: boolean;
};

export function useAdminToeicTestsQuery({ enabled }: UseAdminToeicTestsQueryParams) {
  const query = useQuery({
    queryKey: getAdminToeicTestsQueryKey(),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listAdminToeicTests({ token, signal }),
      }),
    enabled,
  });

  return {
    tests: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  };
}

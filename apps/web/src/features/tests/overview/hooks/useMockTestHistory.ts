"use client";

import { useQuery } from "@tanstack/react-query";
import { listRuntimeMockRuns } from "@/entities/toeic-runtime/api/runtime";
import { getRuntimeMockHistoryQueryKey } from "@/entities/toeic-runtime/model/cache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

type UseMockTestHistoryParams = {
  isAuthenticated: boolean;
  userId: string | null;
  testKey: string | null;
};

export function useMockTestHistory({
  isAuthenticated,
  userId,
  testKey,
}: UseMockTestHistoryParams) {
  const query = useQuery({
    queryKey: getRuntimeMockHistoryQueryKey(userId, testKey),
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) => listRuntimeMockRuns(token, testKey!),
      }),
    enabled: isAuthenticated && Boolean(testKey),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot load mock test history."),
    reload: query.refetch,
  };
}

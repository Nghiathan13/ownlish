"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getToeicRun } from "@/entities/toeic/api/toeic";
import { getToeicRunQueryKey } from "@/entities/toeic/lib/toeicCache";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";

export type UseMockRunQueryParams = {
  sessionId: string;
  selectedParts?: number[];
  enabled?: boolean;
};

export function useMockRunQuery({
  sessionId,
  selectedParts,
  enabled = true,
}: UseMockRunQueryParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const queryKey = useMemo(() => getToeicRunQueryKey(sessionId), [sessionId]);

  const query = useQuery({
    queryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) =>
          getToeicRun(token, sessionId, {
            parts: selectedParts,
          }),
      }),
    enabled: enabled && Boolean(isAuthenticated && sessionId),
    staleTime: Infinity,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    queryKey,
    data: query.data,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot load mock test."),
  };
}

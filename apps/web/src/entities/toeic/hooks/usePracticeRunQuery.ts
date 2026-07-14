"use client";

import { useQuery } from "@tanstack/react-query";
import { getToeicRun } from "@/entities/toeic/api/toeic";
import type { PracticeMode } from "@/entities/toeic/api/types";
import { getPracticeSessionQueryKey } from "@/entities/toeic/lib/toeicCache";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";

export type UsePracticeRunQueryParams = {
  sessionId: string;
  selectedParts: number[];
  mode?: PracticeMode;
  enabled: boolean;
};

export function usePracticeRunQuery({
  sessionId,
  selectedParts,
  mode = "practice",
  enabled,
}: UsePracticeRunQueryParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const queryKey = getPracticeSessionQueryKey(sessionId, selectedParts, mode);

  const query = useQuery({
    queryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) =>
          getToeicRun(token, sessionId, {
            parts: selectedParts,
            mode,
          }),
      }),
    enabled: enabled && isAuthenticated && Boolean(sessionId),
    staleTime: Infinity,
    gcTime: mode === "review_wrong" ? 0 : 5 * 60 * 1000,
    refetchOnMount: false,
    retry: false,
  });

  return {
    queryKey,
    data: query.data,
    isLoading: query.isLoading,
    error: toQueryErrorMessage(query.error, "Cannot start practice session."),
    refetch: query.refetch,
  };
}

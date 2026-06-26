"use client";

import { useQuery } from "@tanstack/react-query";
import { getPartPracticeRun } from "@/entities/toeic/api/partPractice";
import type { PracticeMode } from "@/entities/toeic/api/types";
import { getPartPracticeSessionQueryKey } from "@/entities/toeic/lib/toeicCache";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";

export type UsePartPracticeRunQueryParams = {
  sessionId: string;
  mode?: PracticeMode;
  enabled: boolean;
};

export function usePartPracticeRunQuery({
  sessionId,
  mode = "practice",
  enabled,
}: UsePartPracticeRunQueryParams) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const queryKey = getPartPracticeSessionQueryKey(sessionId, mode);

  const query = useQuery({
    queryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) =>
          getPartPracticeRun(token, sessionId, {
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
    error: toQueryErrorMessage(query.error, "Cannot start part practice session."),
    userId: user?.id ?? null,
    refetch: query.refetch,
  };
}

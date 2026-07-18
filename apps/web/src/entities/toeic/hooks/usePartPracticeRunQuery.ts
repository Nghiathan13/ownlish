"use client";

import { useQuery } from "@tanstack/react-query";
import type { PracticeMode } from "@/entities/toeic/api/types";
import { getToeicCatalog, getToeicCatalogDocument } from "@/entities/toeic-catalog/api/catalog";
import { getRuntimeRun } from "@/entities/toeic-runtime/api/runtime";
import { getPartPracticeSessionQueryKey } from "@/entities/toeic/lib/toeicCache";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";
import { materializeRuntimePartPractice } from "@/features/tests/part-practice/model/materializeRuntimePartPractice";

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
    queryFn: async () => {
      const [run, source] = await Promise.all([
        runAuthenticatedRequest({
          request: (token) => getRuntimeRun(token, sessionId),
        }),
        getToeicCatalog(),
      ]);
      const partNumber = run.partNumber;
      const part = source.manifest.partPractice.find(
        (candidate) => candidate.number === partNumber,
      );

      if (run.scope !== "part_practice" || partNumber == null || !part) {
        throw new Error("Part practice session is unavailable.");
      }

      const document = await getToeicCatalogDocument(source, part.path);
      return materializeRuntimePartPractice(document, source, run, mode);
    },
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

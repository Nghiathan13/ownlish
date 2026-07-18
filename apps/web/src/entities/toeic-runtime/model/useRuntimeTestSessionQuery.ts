"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getToeicCatalog,
  getToeicCatalogDocument,
} from "@/entities/toeic-catalog/api/catalog";
import { getRuntimeRun } from "@/entities/toeic-runtime/api/runtime";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import { getRuntimeTestSessionQueryKey } from "./cache";
import {
  materializeTestSession,
  type RuntimeTestSessionMode,
} from "./materializeTestSession";

type UseRuntimeTestSessionQueryParams = {
  sessionId: string;
  mode: RuntimeTestSessionMode;
  partNumbers?: number[];
  enabled: boolean;
};

function normalizePartNumbers(partNumbers: number[]) {
  return [...new Set(partNumbers)].sort((left, right) => left - right);
}

export function useRuntimeTestSessionQuery({
  sessionId,
  mode,
  partNumbers,
  enabled,
}: UseRuntimeTestSessionQueryParams) {
  const selectedPartNumbers = partNumbers
    ? normalizePartNumbers(partNumbers)
    : undefined;
  const queryKey = getRuntimeTestSessionQueryKey(sessionId, mode, selectedPartNumbers);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const [run, source] = await Promise.all([
        runAuthenticatedRequest({
          request: (token) => getRuntimeRun(token, sessionId),
        }),
        getToeicCatalog(),
      ]);
      const test = source.manifest.tests.find((candidate) => candidate.id === run.testKey);

      if (run.scope !== "test" || !test) {
        throw new Error("Test session is unavailable.");
      }

      const viewPartNumbers = selectedPartNumbers ?? run.selectedParts;
      if (
        viewPartNumbers.length === 0 ||
        viewPartNumbers.some((partNumber) => !run.selectedParts.includes(partNumber))
      ) {
        throw new Error("Selected test parts are unavailable.");
      }

      const parts = test.parts.filter((part) => viewPartNumbers.includes(part.number));
      if (parts.length !== viewPartNumbers.length) {
        throw new Error("Selected test parts are unavailable.");
      }

      const documents = await Promise.all(
        parts.map(async (part) => ({
          partNumber: part.number,
          document: await getToeicCatalogDocument(source, part.path),
        })),
      );

      return materializeTestSession(
        documents,
        source,
        { ...run, selectedParts: viewPartNumbers },
        mode,
      );
    },
    enabled: enabled && Boolean(sessionId),
    staleTime: Infinity,
    gcTime: mode === "review_wrong" ? 0 : 5 * 60 * 1000,
    refetchOnMount: false,
    retry: false,
  });

  return {
    queryKey,
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: toQueryErrorMessage(query.error, "Cannot load test session."),
    refetch: query.refetch,
  };
}

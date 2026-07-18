"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getToeicCatalog,
  getToeicCatalogDocument,
} from "@/entities/toeic-catalog/api/catalog";
import type {
  ToeicCatalogSource,
  ToeicCatalogTest,
} from "@/entities/toeic-catalog/model/types";
import { toeicCatalogQueryKey } from "@/entities/toeic-catalog/model/useToeicCatalogQuery";
import { getRuntimeRun } from "@/entities/toeic-runtime/api/runtime";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import { getRuntimeTestSessionQueryKey } from "./cache";
import {
  materializeTestSession,
  type RuntimeTestSession,
  type RuntimeTestSessionMode,
} from "./materializeTestSession";

type UseRuntimeTestSessionQueryParams = {
  sessionId: string;
  mode: RuntimeTestSessionMode;
  partNumbers?: number[];
  catalogTestKey?: string | null;
  onCatalogLoaded?: (source: ToeicCatalogSource) => void;
  onTestResolved?: (
    source: ToeicCatalogSource,
    test: ToeicCatalogTest,
    partNumbers: number[],
  ) => void;
  onSessionMaterialized?: (
    source: ToeicCatalogSource,
    session: RuntimeTestSession,
  ) => void;
  enabled: boolean;
};

function normalizePartNumbers(partNumbers: number[]) {
  return [...new Set(partNumbers)].sort((left, right) => left - right);
}

export function useRuntimeTestSessionQuery({
  sessionId,
  mode,
  partNumbers,
  catalogTestKey,
  onCatalogLoaded,
  onTestResolved,
  onSessionMaterialized,
  enabled,
}: UseRuntimeTestSessionQueryParams) {
  const queryClient = useQueryClient();
  const selectedPartNumbers = partNumbers
    ? normalizePartNumbers(partNumbers)
    : undefined;
  const queryKey = getRuntimeTestSessionQueryKey(sessionId, mode, selectedPartNumbers);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const sourcePromise = queryClient.ensureQueryData({
        queryKey: toeicCatalogQueryKey,
        queryFn: getToeicCatalog,
        staleTime: Infinity,
      }).then((source) => {
        onCatalogLoaded?.(source);
        return source;
      });
      const documentsFromCatalogPromise =
        catalogTestKey && selectedPartNumbers
          ? sourcePromise.then(async (source) => {
              const catalogTest = source.manifest.tests.find(
                (candidate) => candidate.id === catalogTestKey,
              );
              const catalogParts = catalogTest?.parts.filter((part) =>
                selectedPartNumbers.includes(part.number),
              );

              if (!catalogTest || catalogParts?.length !== selectedPartNumbers.length) {
                throw new Error("Selected test parts are unavailable.");
              }

              return Promise.all(
                catalogParts.map(async (part) => ({
                  partNumber: part.number,
                  document: await getToeicCatalogDocument(source, part.path),
                })),
              );
            })
          : null;
      const [run, source, documentsFromCatalog] = await Promise.all([
        runAuthenticatedRequest({
          request: (token) => getRuntimeRun(token, sessionId),
        }),
        sourcePromise,
        documentsFromCatalogPromise,
      ]);
      const test = source.manifest.tests.find((candidate) => candidate.id === run.testKey);

      if (run.scope !== "test" || !test || (catalogTestKey && run.testKey !== catalogTestKey)) {
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

      onTestResolved?.(source, test, viewPartNumbers);

      const documents = documentsFromCatalog ?? await Promise.all(
        parts.map(async (part) => ({
          partNumber: part.number,
          document: await getToeicCatalogDocument(source, part.path),
        })),
      );

      const session = materializeTestSession(
        documents,
        source,
        { ...run, selectedParts: viewPartNumbers },
        mode,
      );
      onSessionMaterialized?.(source, session);

      return session;
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

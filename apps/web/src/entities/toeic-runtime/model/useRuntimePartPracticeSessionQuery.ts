"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PracticeMode } from "@/entities/toeic/api/types";
import { getToeicCatalog, getToeicCatalogDocument } from "@/entities/toeic-catalog/api/catalog";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import { toeicCatalogQueryKey } from "@/entities/toeic-catalog/model/useToeicCatalogQuery";
import { getRuntimeRun } from "@/entities/toeic-runtime/api/runtime";
import { getPartPracticeSessionQueryKey } from "./cache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import {
  materializePartPracticeSession,
  type RuntimePartPracticeSession,
} from "./materializePartPracticeSession";

export type UseRuntimePartPracticeSessionQueryParams = {
  sessionId: string;
  catalogPartNumber?: number | null;
  mode?: PracticeMode;
  enabled: boolean;
  userId: string | null;
  onCatalogLoaded?: (source: ToeicCatalogSource) => void;
  onSessionMaterialized?: (
    source: ToeicCatalogSource,
    session: RuntimePartPracticeSession,
  ) => void;
};

export function useRuntimePartPracticeSessionQuery({
  sessionId,
  catalogPartNumber,
  mode = "practice",
  enabled,
  userId,
  onCatalogLoaded,
  onSessionMaterialized,
}: UseRuntimePartPracticeSessionQueryParams) {
  const queryClient = useQueryClient();
  const queryKey = getPartPracticeSessionQueryKey(sessionId, mode);

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
      const documentFromCatalogPromise =
        catalogPartNumber != null
          ? sourcePromise.then((source) => {
              const catalogPart = source.manifest.partPractice.find(
                (part) => part.number === catalogPartNumber,
              );
              if (!catalogPart) {
                throw new Error("Part practice data is unavailable.");
              }

              return getToeicCatalogDocument(source, catalogPart.path);
            })
          : null;
      const [run, source, documentFromCatalog] = await Promise.all([
        runAuthenticatedRequest({
          request: (token) => getRuntimeRun(token, sessionId),
        }),
        sourcePromise,
        documentFromCatalogPromise,
      ]);
      const partNumber = run.partNumber;
      const part = source.manifest.partPractice.find(
        (candidate) => candidate.number === partNumber,
      );

      if (
        run.scope !== "part_practice"
        || partNumber == null
        || !part
        || (catalogPartNumber != null && partNumber !== catalogPartNumber)
      ) {
        throw new Error("Part practice session is unavailable.");
      }

      const document = documentFromCatalog
        ?? await getToeicCatalogDocument(source, part.path);
      const session = materializePartPracticeSession(document, source, run, mode);
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
    error: toQueryErrorMessage(query.error, "Cannot start part practice session."),
    userId,
    refetch: query.refetch,
  };
}

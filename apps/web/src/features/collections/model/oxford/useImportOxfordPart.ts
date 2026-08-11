"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importOxfordPart } from "@/entities/collection";
import { invalidateVocabUserQueries } from "@/entities/vocab";
import { runAuthenticatedRequest } from "@/entities/session";
import type { OxfordBand } from "@/entities/collection";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

export function useImportOxfordPart(userId: string | null) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      band,
      catalogDefinitionIds,
      part,
      targetCollectionId,
    }: {
      band: OxfordBand;
      catalogDefinitionIds: string[];
      part: number;
      targetCollectionId?: string;
    }) =>
      runAuthenticatedRequest({
        request: (token) =>
          importOxfordPart(token, band, part, catalogDefinitionIds, {
            targetCollectionId,
          }),
      }),
    onSuccess: () => {
      invalidateVocabUserQueries(queryClient, userId);
    },
  });

  return {
    importPart: mutation.mutateAsync,
    importError: toQueryErrorMessage(
      mutation.error,
      "Cannot import Oxford words.",
    ),
    isImporting: mutation.isPending,
    resetImportState: mutation.reset,
  };
}

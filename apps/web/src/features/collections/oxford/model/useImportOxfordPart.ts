"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importOxfordPart } from "@/entities/collection/api/collections";
import { invalidateImportedVocabulary } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useImportOxfordPart(userId: string | null) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      band,
      catalogDefinitionIds,
      part,
    }: {
      band: OxfordBand;
      catalogDefinitionIds: string[];
      part: number;
    }) =>
      runAuthenticatedRequest({
        request: (token) =>
          importOxfordPart(token, band, part, catalogDefinitionIds),
      }),
    onSuccess: () => {
      invalidateImportedVocabulary(queryClient, userId);
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

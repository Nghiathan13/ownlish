"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importCollection,
  type ImportCollectionInput,
} from "@/entities/collection";
import { invalidateCollectionMutationQueries } from "@/entities/collection";
import { invalidateVocabUserQueries } from "@/entities/vocab";
import { runAuthenticatedRequest } from "@/entities/session";
import type { CollectionMutationParams } from "../../../lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import type { ImportCollectionVariables } from "./types";

export function useImportCollection({ userId }: CollectionMutationParams) {
  const queryClient = useQueryClient();
  const importMutation = useMutation({
    mutationFn: ({
      catalogDefinitionIds,
      limit,
      offset,
      systemCollectionId,
      targetCollectionId,
    }: ImportCollectionVariables) =>
      runAuthenticatedRequest({
        request: (token) => {
          const input: ImportCollectionInput = {};

          if (targetCollectionId) {
            input.targetCollectionId = targetCollectionId;
          }

          if (catalogDefinitionIds?.length) {
            input.catalogDefinitionIds = catalogDefinitionIds;
          }

          if (offset !== undefined && limit !== undefined) {
            input.offset = offset;
            input.limit = limit;
          }

          return importCollection(token, systemCollectionId, input);
        },
      }),
    onSuccess: () => {
      invalidateCollectionMutationQueries(queryClient, userId);
      invalidateVocabUserQueries(queryClient, userId);
    },
  });

  return {
    importCollection: importMutation.mutateAsync,
    importError: toQueryErrorMessage(
      importMutation.error,
      "Cannot import collection.",
    ),
    isImporting: importMutation.isPending,
    resetImportState: importMutation.reset,
  };
}

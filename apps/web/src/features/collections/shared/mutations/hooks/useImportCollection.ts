"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importCollection,
  type ImportCollectionInput,
} from "@/entities/collection/api/collections";
import { invalidateCollectionMutationQueries } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionMutationParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";
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

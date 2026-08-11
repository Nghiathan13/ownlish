"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCollection } from "@/entities/collection";
import { invalidateCollectionMutationQueries } from "@/entities/collection";
import { invalidateVocabUserQueries } from "@/entities/vocab";
import { runAuthenticatedRequest } from "@/entities/session";
import type { CollectionMutationParams } from "../../../lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

export function useDeleteCollection({ userId }: CollectionMutationParams) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (collectionId: string) =>
      runAuthenticatedRequest({
        request: (token) => deleteCollection(token, collectionId),
      }),
    onSuccess: () => {
      invalidateCollectionMutationQueries(queryClient, userId);
      invalidateVocabUserQueries(queryClient, userId);
    },
  });

  return {
    deleteCollection: deleteMutation.mutateAsync,
    deleteError: toQueryErrorMessage(
      deleteMutation.error,
      "Cannot delete collection.",
    ),
    deletingCollectionId: deleteMutation.isPending
      ? (deleteMutation.variables ?? null)
      : null,
    isDeletingCollection: deleteMutation.isPending,
    resetDeleteState: deleteMutation.reset,
  };
}

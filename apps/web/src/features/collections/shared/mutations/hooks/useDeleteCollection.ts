"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCollection } from "@/entities/collection/api/collections";
import { invalidateCollectionMutationQueries } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionMutationParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useDeleteCollection({ userId }: CollectionMutationParams) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (collectionId: string) =>
      runAuthenticatedRequest({
        request: (token) => deleteCollection(token, collectionId),
      }),
    onSuccess: () => {
      invalidateCollectionMutationQueries(queryClient, userId);
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

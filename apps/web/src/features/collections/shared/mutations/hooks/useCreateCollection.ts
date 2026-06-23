"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  type CreateCollectionInput,
} from "@/entities/collection/api/collections";
import { invalidateCollectionsList } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionMutationParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useCreateCollection({ userId }: CollectionMutationParams) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      runAuthenticatedRequest({
        request: (token) => createCollection(token, input),
      }),
    onSuccess: () => {
      invalidateCollectionsList(queryClient, userId);
    },
  });

  return {
    createCollection: createMutation.mutateAsync,
    createError: toQueryErrorMessage(
      createMutation.error,
      "Cannot create collection.",
    ),
    isCreatingCollection: createMutation.isPending,
    resetCreateState: createMutation.reset,
  };
}

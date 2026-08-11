"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  type CreateCollectionInput,
} from "@/entities/collection";
import { invalidateCollectionsList } from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import type { CollectionMutationParams } from "../../../lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

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

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCollection } from "@/entities/collection";
import {
  invalidateCollectionDetail,
  invalidateCollectionsList,
} from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import type { CollectionMutationParams } from "../../../lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import type { UpdateCollectionVariables } from "./types";

export function useUpdateCollection({ userId }: CollectionMutationParams) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ collectionId, input }: UpdateCollectionVariables) =>
      runAuthenticatedRequest({
        request: (token) => updateCollection(token, collectionId, input),
      }),
    onSuccess: (_data, variables) => {
      invalidateCollectionsList(queryClient, userId);
      invalidateCollectionDetail(
        queryClient,
        userId,
        variables.collectionId,
      );
    },
  });

  return {
    isUpdatingCollection: updateMutation.isPending,
    resetUpdateState: updateMutation.reset,
    updateCollection: updateMutation.mutateAsync,
    updateError: toQueryErrorMessage(
      updateMutation.error,
      "Cannot update collection.",
    ),
  };
}

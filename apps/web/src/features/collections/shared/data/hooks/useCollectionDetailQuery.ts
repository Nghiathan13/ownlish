"use client";

import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/entities/collection/api/collections";
import { getCollectionDetailQueryKey } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionDetailQueryParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useCollectionDetailQuery({
  collectionId,
  enabled = true,
  isAuthenticated,
  userId,
}: CollectionDetailQueryParams) {
  const collectionDetailQuery = useQuery({
    queryKey: getCollectionDetailQueryKey(userId, collectionId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) =>
          getCollection(token, collectionId as string, {
            signal,
          }),
      }),
    enabled:
      isAuthenticated &&
      Boolean(userId) &&
      Boolean(collectionId) &&
      enabled,
  });

  return {
    collectionDetail: collectionDetailQuery.data ?? null,
    collectionDetailError: toQueryErrorMessage(
      collectionDetailQuery.error,
      "Cannot load collection.",
    ),
    isLoadingCollectionDetail: collectionDetailQuery.isLoading,
    reloadCollectionDetail: collectionDetailQuery.refetch,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getCollectionCatalogWords } from "@/entities/collection/api/collections";
import { getCollectionCatalogWordsQueryKey } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionCatalogWordsQueryParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useCollectionCatalogWordsQuery({
  collectionId,
  isAuthenticated,
  limit,
  offset,
  userId,
}: CollectionCatalogWordsQueryParams) {
  const query = useQuery({
    queryKey: getCollectionCatalogWordsQueryKey(
      userId,
      collectionId,
      offset,
      limit,
    ),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) =>
          getCollectionCatalogWords(
            token,
            collectionId as string,
            { limit, offset },
            { signal },
          ),
      }),
    enabled:
      isAuthenticated && Boolean(userId) && Boolean(collectionId),
  });

  return {
    error: toQueryErrorMessage(query.error, "Cannot load catalog words."),
    isLoading: query.isLoading,
    page: query.data ?? null,
    reload: query.refetch,
  };
}

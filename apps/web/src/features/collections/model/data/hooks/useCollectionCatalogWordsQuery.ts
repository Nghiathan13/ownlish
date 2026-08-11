"use client";

import { useQuery } from "@tanstack/react-query";
import { getCollectionCatalogWords } from "@/entities/collection";
import { getCollectionCatalogWordsQueryKey } from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import type { CollectionCatalogWordsQueryParams } from "../../../lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

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

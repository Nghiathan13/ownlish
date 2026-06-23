"use client";

import { useQuery } from "@tanstack/react-query";
import { listCollections } from "@/entities/collection/api/collections";
import { getCollectionsQueryKey } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionAuthParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useCollectionsListQuery({
  isAuthenticated,
  userId,
}: CollectionAuthParams) {
  const collectionsQuery = useQuery({
    queryKey: getCollectionsQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listCollections(token, { signal }),
      }),
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 60_000,
  });

  return {
    collections: collectionsQuery.data ?? [],
    collectionsError: toQueryErrorMessage(
      collectionsQuery.error,
      "Cannot load collections.",
    ),
    hasCollectionsList: collectionsQuery.data !== undefined,
    isLoadingCollections: collectionsQuery.isLoading,
    reloadCollections: collectionsQuery.refetch,
  };
}

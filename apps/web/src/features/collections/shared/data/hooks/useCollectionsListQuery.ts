"use client";

import { useQuery } from "@tanstack/react-query";
import { listCollections } from "@/entities/collection/api/collections";
import { getCollectionsQueryKey } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { CollectionAuthParams } from "@/features/collections/shared/lib/collectionQueryParams";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function getCollectionsListQueryOptions(userId: string) {
  return {
    queryKey: getCollectionsQueryKey(userId),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      runAuthenticatedRequest({
        request: (token) => listCollections(token, { signal }),
      }),
    staleTime: 60_000,
  };
}

export function useCollectionsListQuery({
  isAuthenticated,
  userId,
}: CollectionAuthParams) {
  const collectionsQuery = useQuery({
    ...getCollectionsListQueryOptions(userId ?? ""),
    queryKey: getCollectionsQueryKey(userId),
    enabled: isAuthenticated && Boolean(userId),
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

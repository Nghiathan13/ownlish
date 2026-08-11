"use client";

import { useQuery } from "@tanstack/react-query";
import { runAuthenticatedRequest } from "@/entities/session/@x/collection";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import { listCollections } from "../api/collections";
import { getCollectionsQueryKey } from "../lib/collectionsCache";

type CollectionAuthParams = {
  isAuthenticated: boolean;
  userId: string | null;
};

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

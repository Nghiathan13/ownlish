"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCollection,
  importCollection,
  listCollections,
} from "@/entities/collection/api/collections";
import { getReviewQueueQueryKey } from "@/entities/vocab/lib/reviewQueueCache";
import { getVocabUserQueryKey } from "@/entities/vocab/lib/vocabCache";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { ApiError } from "@/shared/api/http";

type UseCollectionsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  userId: string | null;
};

type UseCollectionDetailParams = UseCollectionsParams & {
  collectionId: string | null;
};

export function getCollectionsQueryKey(userId: string | null) {
  return ["collections", { userId }] as const;
}

export function getCollectionDetailQueryKey(
  userId: string | null,
  collectionId: string | null,
) {
  return ["collection", { userId, collectionId }] as const;
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : error ? fallback : null;
}

export function useCollectionsList({
  accessToken,
  clearSession,
  isAuthenticated,
  userId,
}: UseCollectionsParams) {
  const collectionsQuery = useQuery({
    queryKey: getCollectionsQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => listCollections(token, { signal }),
      }),
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(userId),
  });

  return {
    collections: collectionsQuery.data ?? [],
    collectionsError: toErrorMessage(
      collectionsQuery.error,
      "Cannot load collections.",
    ),
    isLoadingCollections: collectionsQuery.isLoading,
    reloadCollections: collectionsQuery.refetch,
  };
}

export function useCollectionDetail({
  accessToken,
  clearSession,
  collectionId,
  isAuthenticated,
  userId,
}: UseCollectionDetailParams) {
  const collectionDetailQuery = useQuery({
    queryKey: getCollectionDetailQueryKey(userId, collectionId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          getCollection(token, collectionId as string, {
            signal,
          }),
      }),
    enabled:
      isAuthenticated &&
      Boolean(accessToken) &&
      Boolean(userId) &&
      Boolean(collectionId),
  });

  return {
    collectionDetail: collectionDetailQuery.data ?? null,
    collectionDetailError: toErrorMessage(
      collectionDetailQuery.error,
      "Cannot load collection.",
    ),
    isLoadingCollectionDetail: collectionDetailQuery.isLoading,
    reloadCollectionDetail: collectionDetailQuery.refetch,
  };
}

export function useImportCollection({
  accessToken,
  clearSession,
  userId,
}: Pick<UseCollectionsParams, "accessToken" | "clearSession" | "userId">) {
  const queryClient = useQueryClient();
  const importMutation = useMutation({
    mutationFn: (collectionId: string) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => importCollection(token, collectionId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getVocabUserQueryKey(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: getReviewQueueQueryKey(userId),
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: getVocabStatsQueryKey(userId),
        exact: true,
      });
    },
  });

  return {
    importCollection: importMutation.mutateAsync,
    importError: toErrorMessage(importMutation.error, "Cannot import collection."),
    isImporting: importMutation.isPending,
    resetImportState: importMutation.reset,
  };
}

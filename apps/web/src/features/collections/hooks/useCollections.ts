"use client";

import { useMemo, useState } from "react";
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

function getCollectionsQueryKey(userId: string | null) {
  return ["collections", { userId }] as const;
}

function getCollectionDetailQueryKey(
  userId: string | null,
  collectionId: string | null,
) {
  return ["collection", { userId, collectionId }] as const;
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : error ? fallback : null;
}

export function useCollections({
  accessToken,
  clearSession,
  isAuthenticated,
  userId,
}: UseCollectionsParams) {
  const queryClient = useQueryClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    null,
  );
  const [importResultMessage, setImportResultMessage] = useState<string | null>(
    null,
  );
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
  const selectedCollectionIdOrFirst = useMemo(() => {
    return selectedCollectionId ?? collectionsQuery.data?.[0]?.id ?? null;
  }, [collectionsQuery.data, selectedCollectionId]);
  const collectionDetailQuery = useQuery({
    queryKey: getCollectionDetailQueryKey(userId, selectedCollectionIdOrFirst),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          getCollection(token, selectedCollectionIdOrFirst as string, {
            signal,
          }),
      }),
    enabled:
      isAuthenticated &&
      Boolean(accessToken) &&
      Boolean(userId) &&
      Boolean(selectedCollectionIdOrFirst),
  });
  const importMutation = useMutation({
    mutationFn: (collectionId: string) =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => importCollection(token, collectionId),
      }),
    onSuccess: (result) => {
      setImportResultMessage(
        `Imported ${result.imported} words. Skipped ${result.skipped} existing words.`,
      );
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
  const resetImportState = () => {
    setImportResultMessage(null);
    importMutation.reset();
  };

  return {
    collectionDetail: collectionDetailQuery.data ?? null,
    collectionDetailError: toErrorMessage(
      collectionDetailQuery.error,
      "Cannot load collection.",
    ),
    collections: collectionsQuery.data ?? [],
    collectionsError: toErrorMessage(
      collectionsQuery.error,
      "Cannot load collections.",
    ),
    importCollection: importMutation.mutateAsync,
    importError: toErrorMessage(importMutation.error, "Cannot import collection."),
    importResultMessage,
    isImporting: importMutation.isPending,
    isLoadingCollectionDetail: collectionDetailQuery.isLoading,
    isLoadingCollections: collectionsQuery.isLoading,
    reloadCollectionDetail: collectionDetailQuery.refetch,
    reloadCollections: collectionsQuery.refetch,
    resetImportState,
    selectedCollectionId: selectedCollectionIdOrFirst,
    setImportResultMessage,
    setSelectedCollectionId,
  };
}

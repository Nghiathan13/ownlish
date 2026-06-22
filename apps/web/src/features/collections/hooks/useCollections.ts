"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  getCollection,
  importCollection,
  listCollections,
  type CreateCollectionInput,
} from "@/entities/collection/api/collections";
import { getReviewQueueQueryKey } from "@/entities/vocab/lib/reviewQueueCache";
import { getVocabUserQueryKey } from "@/entities/vocab/lib/vocabCache";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

type UseCollectionsParams = {
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
  isAuthenticated,
  userId,
}: UseCollectionsParams) {
  const collectionsQuery = useQuery({
    queryKey: getCollectionsQueryKey(userId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => listCollections(token, { signal }),
      }),
    enabled: isAuthenticated && Boolean(userId),
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
  collectionId,
  isAuthenticated,
  userId,
}: UseCollectionDetailParams) {
  const collectionDetailQuery = useQuery({
    queryKey: getCollectionDetailQueryKey(userId, collectionId),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) =>
          getCollection(token, collectionId as string, {
            signal,
          }),
      }),
    enabled: isAuthenticated && Boolean(userId) && Boolean(collectionId),
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

export function useCreateCollection({
  userId,
}: Pick<UseCollectionsParams, "userId">) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      runAuthenticatedRequest({
        request: (token) => createCollection(token, input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCollectionsQueryKey(userId),
      });
    },
  });

  return {
    createCollection: createMutation.mutateAsync,
    createError: toErrorMessage(
      createMutation.error,
      "Cannot create collection.",
    ),
    isCreatingCollection: createMutation.isPending,
    resetCreateState: createMutation.reset,
  };
}

import type { ImportCollectionInput } from "@/entities/collection/api/collections";

type ImportCollectionVariables = {
  catalogDefinitionIds?: string[];
  systemCollectionId: string;
  targetCollectionId?: string;
};

export function useImportCollection({
  userId,
}: Pick<UseCollectionsParams, "userId">) {
  const queryClient = useQueryClient();
  const importMutation = useMutation({
    mutationFn: ({
      catalogDefinitionIds,
      systemCollectionId,
      targetCollectionId,
    }: ImportCollectionVariables) =>
      runAuthenticatedRequest({
        request: (token) => {
          const input: ImportCollectionInput = {};

          if (targetCollectionId) {
            input.targetCollectionId = targetCollectionId;
          }

          if (catalogDefinitionIds?.length) {
            input.catalogDefinitionIds = catalogDefinitionIds;
          }

          return importCollection(token, systemCollectionId, input);
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCollectionsQueryKey(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: getVocabUserQueryKey(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: getReviewQueueQueryKey(userId),
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: getVocabStatsQueryKey(userId),
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

"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  gradeOxfordReviewDefinition,
  type OxfordPartReview,
  type OxfordReviewRating,
  type OxfordReviewItem,
} from "@/entities/review/api/oxfordReview";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";
import {
  getOxfordPartReviewQueryKey,
  getOxfordPartReviewQueryOptions,
} from "./oxfordReviewQueries";
import { getOxfordCollectionMetaQueryKey } from "@/entities/collection/lib/collectionsCache";

type UseOxfordPartReviewQueueParams = {
  band: string;
  isAuthenticated: boolean;
  part: number;
  userId: string | null;
};

type QueueState = {
  itemIds: string[];
  reviewedCount: number;
  sourceKey: string | null;
};

const EMPTY_ITEMS: OxfordReviewItem[] = [];

export function useOxfordPartReviewQueue({
  band,
  isAuthenticated,
  part,
  userId,
}: UseOxfordPartReviewQueueParams) {
  const queryClient = useQueryClient();
  const queryKey = getOxfordPartReviewQueryKey(userId, band, part);
  const [queueState, setQueueState] = useState<QueueState>({
    sourceKey: null,
    itemIds: [],
    reviewedCount: 0,
  });

  const query = useQuery({
    ...getOxfordPartReviewQueryOptions(userId ?? "", band, part),
    queryKey,
    enabled: isAuthenticated && Boolean(userId),
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const isShowingPreviousData = query.isPlaceholderData;
  const items = query.data?.items ?? EMPTY_ITEMS;
  const sourceKey = items.map((item) => item.id).join(",");

  if (!isShowingPreviousData && queueState.sourceKey !== sourceKey) {
    setQueueState({
      sourceKey,
      itemIds: items.map((item) => item.id),
      reviewedCount: 0,
    });
  }

  const wordsById = useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);
  // While keepPreviousData is showing the prior band/part, keep that queue
  // (including reviewedCount) until the new payload arrives.
  const isCurrentQueue = queueState.sourceKey === sourceKey;
  const activeQueueIds = isCurrentQueue
    ? queueState.itemIds
    : items.map((item) => item.id);
  const queue = activeQueueIds.flatMap((wordId) => {
    const word = wordsById.get(wordId);
    return word ? [word] : [];
  });
  const currentWord = queue[0] ?? null;

  const mutation = useMutation({
    mutationFn: ({ definitionId, rating }: { definitionId: string; rating: OxfordReviewRating }) => {
      return runAuthenticatedRequest({
        request: (token) =>
          gradeOxfordReviewDefinition(token, { band, part, definitionId, rating }),
      });
    },
    onMutate: async ({ definitionId }) => {
      const previousQueue = activeQueueIds;
      setQueueState((current) => ({
        sourceKey,
        itemIds: (current.sourceKey === sourceKey ? current.itemIds : activeQueueIds).filter(
          (currentWordId) => currentWordId !== definitionId,
        ),
        reviewedCount: (current.sourceKey === sourceKey ? current.reviewedCount : 0) + 1,
      }));
      return { previousQueue };
    },
    onError: (_error, _variables, context) => {
      setQueueState((current) => ({
        sourceKey,
        itemIds: context?.previousQueue ?? [],
        reviewedCount: Math.max(
          0,
          (current.sourceKey === sourceKey ? current.reviewedCount : 0) - 1,
        ),
      }));
    },
    onSuccess: (progress, { definitionId }) => {
      queryClient.setQueryData<OxfordPartReview>(queryKey, (current) => {
        if (!current) return current;

        return {
          ...current,
          items: current.items.map((item) =>
            item.id === definitionId ? { ...item, progress } : item,
          ),
        };
      });
      void queryClient.invalidateQueries({
        queryKey: getOxfordCollectionMetaQueryKey(userId, band),
      });
    },
  });

  const gradeCurrentWord = useCallback(
    (rating: OxfordReviewRating) => {
      if (!currentWord || mutation.isPending || isShowingPreviousData) return;
      mutation.mutate({ definitionId: currentWord.id, rating });
    },
    [currentWord, isShowingPreviousData, mutation],
  );

  const reload = useCallback(() => {
    mutation.reset();
    setQueueState({ sourceKey: null, itemIds: [], reviewedCount: 0 });
    void query.refetch();
  }, [mutation, query]);

  const error = query.error ?? mutation.error;
  const errorMessage = error
    ? error instanceof ApiError
      ? error.message
      : "Cannot load this Oxford review."
    : null;

  return {
    currentWord,
    error: errorMessage,
    gradeCurrentWord,
    isEmpty: !query.isPending && !isShowingPreviousData && !errorMessage && queue.length === 0,
    isLoading: query.isPending && !query.isPlaceholderData,
    isSubmitting: mutation.isPending || isShowingPreviousData,
    reload,
    reviewedCount: isCurrentQueue ? queueState.reviewedCount : 0,
    totalWords: items.length,
  };
}

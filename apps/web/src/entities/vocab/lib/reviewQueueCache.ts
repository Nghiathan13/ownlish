import type { QueryClient } from "@tanstack/react-query";
import type { VocabReviewListResponse } from "@/entities/vocab/api/vocab";

export function getReviewQueueQueryKey(
  userId: string | null,
  collectionId: string | null,
) {
  return ["review-queue", { userId, collectionId }] as const;
}

export function getReviewQueueUserQueryKey(userId: string | null) {
  return ["review-queue", { userId }] as const;
}

export async function optimisticallyRemoveFromReviewQueue(
  queryClient: QueryClient,
  userId: string | null,
  collectionId: string | null,
  definitionId: string,
  { decrementTotal = true }: { decrementTotal?: boolean } = {},
) {
  const queryKey = getReviewQueueQueryKey(userId, collectionId);

  await queryClient.cancelQueries({ queryKey });

  const previousQueue =
    queryClient.getQueryData<VocabReviewListResponse>(queryKey);

  queryClient.setQueryData<VocabReviewListResponse>(queryKey, (oldData) => {
    if (!oldData) {
      return oldData;
    }

    const wasInQueue = oldData.items.some((item) => item.id === definitionId);

    if (!wasInQueue) {
      return oldData;
    }

    return {
      ...oldData,
      items: oldData.items.filter((item) => item.id !== definitionId),
      meta: {
        ...oldData.meta,
        total: decrementTotal
          ? Math.max(0, oldData.meta.total - 1)
          : oldData.meta.total,
      },
    };
  });

  return previousQueue;
}

export function restoreReviewQueue(
  queryClient: QueryClient,
  userId: string | null,
  collectionId: string | null,
  previousQueue: VocabReviewListResponse | undefined,
) {
  if (previousQueue === undefined) {
    return;
  }

  queryClient.setQueryData(
    getReviewQueueQueryKey(userId, collectionId),
    previousQueue,
  );
}

import type { QueryClient } from "@tanstack/react-query";
import type { VocabWordListResponse } from "@/entities/vocab/api/vocab";

export function getReviewQueueQueryKey(userId: string | null) {
  return ["review-queue", { userId }] as const;
}

export async function optimisticallyRemoveFromReviewQueue(
  queryClient: QueryClient,
  userId: string | null,
  wordId: string,
  { decrementTotal = true }: { decrementTotal?: boolean } = {},
) {
  const queryKey = getReviewQueueQueryKey(userId);

  await queryClient.cancelQueries({ queryKey });

  const previousQueue =
    queryClient.getQueryData<VocabWordListResponse>(queryKey);

  queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
    if (!oldData) {
      return oldData;
    }

    const wasInQueue = oldData.items.some((word) => word.id === wordId);

    if (!wasInQueue) {
      return oldData;
    }

    return {
      ...oldData,
      items: oldData.items.filter((word) => word.id !== wordId),
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
  previousQueue: VocabWordListResponse | undefined,
) {
  if (previousQueue === undefined) {
    return;
  }

  queryClient.setQueryData(getReviewQueueQueryKey(userId), previousQueue);
}

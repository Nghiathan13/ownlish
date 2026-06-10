import type { QueryClient } from "@tanstack/react-query";
import type { VocabWordListResponse } from "@/entities/vocab/api/vocab";

export function getReviewQueueQueryKey(accessToken: string | null) {
  return ["review-queue", { accessToken }] as const;
}

export async function optimisticallyRemoveFromReviewQueue(
  queryClient: QueryClient,
  accessToken: string | null,
  wordId: string,
) {
  const queryKey = getReviewQueueQueryKey(accessToken);

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
        total: Math.max(0, oldData.meta.total - 1),
      },
    };
  });

  return previousQueue;
}

export function restoreReviewQueue(
  queryClient: QueryClient,
  accessToken: string | null,
  previousQueue: VocabWordListResponse | undefined,
) {
  if (previousQueue === undefined) {
    return;
  }

  queryClient.setQueryData(
    getReviewQueueQueryKey(accessToken),
    previousQueue,
  );
}

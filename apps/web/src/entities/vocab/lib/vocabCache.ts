import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { VocabularyPageSize } from "./vocabPagination";
import { getReviewQueueQueryKey } from "./reviewQueueCache";
import { getVocabStatsQueryKey } from "./vocabStatsCache";

export type VocabPageState = {
  collectionId: string;
  offset: number;
  pageSize: VocabularyPageSize;
  search: string;
};

export function getVocabQueryKey(
  userId: string | null,
  pageState: VocabPageState,
) {
  return [
    "vocab",
    {
      userId,
      collectionId: pageState.collectionId,
      search: pageState.search,
      offset: pageState.offset,
      limit: pageState.pageSize,
    },
  ] as const;
}

export function getVocabUserQueryKey(userId: string | null) {
  return ["vocab", { userId }] as const;
}

type InvalidateVocabMutationQueriesParams = {
  queryClient: QueryClient;
  userId: string | null;
  collectionId: string | null;
  vocabQueryKey: QueryKey;
};

export function invalidateVocabMutationQueries({
  queryClient,
  userId,
  collectionId,
  vocabQueryKey,
}: InvalidateVocabMutationQueriesParams) {
  void queryClient.invalidateQueries({ queryKey: vocabQueryKey, exact: true });
  void queryClient.invalidateQueries({
    queryKey: getReviewQueueQueryKey(userId, collectionId),
    exact: true,
  });
  void queryClient.invalidateQueries({
    queryKey: getVocabStatsQueryKey(userId, collectionId),
    exact: true,
  });
}

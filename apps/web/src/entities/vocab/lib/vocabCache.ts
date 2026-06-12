import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { getReviewQueueQueryKey } from "./reviewQueueCache";
import { getVocabStatsQueryKey } from "./vocabStatsCache";

export type VocabPageState = {
  offset: number;
  search: string;
};

export function getVocabQueryKey(
  userId: string | null,
  pageState: VocabPageState,
) {
  return [
    "vocab",
    { userId, search: pageState.search, offset: pageState.offset },
  ] as const;
}

export function getVocabUserQueryKey(userId: string | null) {
  return ["vocab", { userId }] as const;
}

type InvalidateVocabMutationQueriesParams = {
  queryClient: QueryClient;
  userId: string | null;
  vocabQueryKey: QueryKey;
};

export function invalidateVocabMutationQueries({
  queryClient,
  userId,
  vocabQueryKey,
}: InvalidateVocabMutationQueriesParams) {
  void queryClient.invalidateQueries({ queryKey: vocabQueryKey, exact: true });
  void queryClient.invalidateQueries({
    queryKey: getReviewQueueQueryKey(userId),
    exact: true,
  });
  void queryClient.invalidateQueries({
    queryKey: getVocabStatsQueryKey(userId),
    exact: true,
  });
}

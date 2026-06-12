import type { QueryClient } from "@tanstack/react-query";
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

export function invalidateVocabMutationQueries(
  queryClient: QueryClient,
  userId: string | null,
) {
  void queryClient.invalidateQueries({ queryKey: ["vocab"] });
  void queryClient.invalidateQueries({ queryKey: ["review-queue"] });
  void queryClient.invalidateQueries({ queryKey: getVocabStatsQueryKey(userId) });
}

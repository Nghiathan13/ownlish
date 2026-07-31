import type { QueryClient } from "@tanstack/react-query";

export function getDifficultReviewWordsQueryKey(userId: string | null) {
  return ["difficult-review-words", { userId }] as const;
}

export function invalidateDifficultReviewWords(
  queryClient: QueryClient,
  userId: string | null,
) {
  void queryClient.invalidateQueries({
    queryKey: getDifficultReviewWordsQueryKey(userId),
  });
}

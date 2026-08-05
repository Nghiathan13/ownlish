import type { QueryClient } from "@tanstack/react-query";
import type { DifficultReviewWordsSource } from "@/entities/review/api/difficultReviewWords";

export function getDifficultReviewWordsQueryKey(
  userId: string | null,
  source: DifficultReviewWordsSource = "collection",
) {
  return ["difficult-review-words", { userId, source }] as const;
}

export function invalidateDifficultReviewWords(
  queryClient: QueryClient,
  userId: string | null,
) {
  void queryClient.invalidateQueries({
    queryKey: ["difficult-review-words"],
    predicate: (query) => {
      const params = query.queryKey[1];
      return (
        typeof params === "object" &&
        params != null &&
        "userId" in params &&
        params.userId === userId
      );
    },
  });
}

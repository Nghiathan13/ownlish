import { getOxfordPartReview } from "@/entities/review/api/oxfordReview";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

export function getOxfordPartReviewQueryKey(
  userId: string | null,
  band: string,
  part: number,
) {
  return ["oxford-part-review", userId, band, part] as const;
}

export function getOxfordPartReviewQueryOptions(
  userId: string,
  band: string,
  part: number,
) {
  return {
    queryKey: getOxfordPartReviewQueryKey(userId, band, part),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      runAuthenticatedRequest({
        request: (token) => getOxfordPartReview(token, band, part, { signal }),
      }),
  };
}

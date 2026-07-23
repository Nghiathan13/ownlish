"use client";

import { useQuery } from "@tanstack/react-query";
import { getOxfordPart } from "@/entities/collection/api/collections";
import { getOxfordPartQueryKey } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useOxfordPartQuery({
  band,
  enabled = true,
  isAuthenticated,
  part,
  userId,
}: {
  band: OxfordBand;
  enabled?: boolean;
  isAuthenticated: boolean;
  part: number;
  userId: string | null;
}) {
  const query = useQuery({
    queryKey: getOxfordPartQueryKey(userId, band, part),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getOxfordPart(token, band, part, { signal }),
      }),
    enabled: enabled && isAuthenticated && Boolean(userId),
  });

  return {
    error: toQueryErrorMessage(query.error, "Cannot load Oxford part."),
    isLoading: query.isLoading,
    part: query.data ?? null,
    reload: query.refetch,
  };
}

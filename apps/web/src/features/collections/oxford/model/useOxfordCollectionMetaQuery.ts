"use client";

import { useQuery } from "@tanstack/react-query";
import { getOxfordCollectionMeta } from "@/entities/collection/api/collections";
import { getOxfordCollectionMetaQueryKey } from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";

export function useOxfordCollectionMetaQuery({
  band,
  enabled = true,
  isAuthenticated,
  userId,
}: {
  band: OxfordBand;
  enabled?: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const query = useQuery({
    queryKey: getOxfordCollectionMetaQueryKey(userId, band),
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getOxfordCollectionMeta(token, band, { signal }),
      }),
    enabled: enabled && isAuthenticated && Boolean(userId),
    staleTime: 60_000,
  });

  return {
    error: toQueryErrorMessage(query.error, "Cannot load Oxford collection."),
    isLoading: query.isLoading,
    meta: query.data ?? null,
    reload: query.refetch,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";
import { getOxfordCollectionMetaQueryOptions } from "./oxfordQueries";

export function useOxfordCollectionMetaQuery({
  band,
  enabled = true,
  isAuthenticated,
}: {
  band: OxfordBand;
  enabled?: boolean;
  isAuthenticated: boolean;
}) {
  const query = useQuery({
    ...getOxfordCollectionMetaQueryOptions(band),
    enabled: enabled && isAuthenticated,
  });

  return {
    error: toQueryErrorMessage(query.error, "Cannot load Oxford collection."),
    isLoading: query.isLoading,
    meta: query.data ?? null,
    reload: query.refetch,
  };
}

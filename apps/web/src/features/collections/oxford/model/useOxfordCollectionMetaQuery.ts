"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { OxfordCollectionMeta } from "@/entities/collection/api/collections";
import {
  OXFORD_BANDS,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";
import { getOxfordCollectionMetaQueryOptions } from "./oxfordQueries";

// Survives route remounts so the part rail does not flash skeleton on band changes.
let lastOxfordCollectionMeta: OxfordCollectionMeta | null = null;

export function useOxfordCollectionMetaQuery({
  band,
  enabled = true,
  isAuthenticated,
}: {
  band: OxfordBand;
  enabled?: boolean;
  isAuthenticated: boolean;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    for (const nextBand of OXFORD_BANDS) {
      void queryClient.prefetchQuery(getOxfordCollectionMetaQueryOptions(nextBand));
    }
  }, [isAuthenticated, queryClient]);

  const query = useQuery({
    ...getOxfordCollectionMetaQueryOptions(band),
    enabled: enabled && isAuthenticated,
    placeholderData: (previousData) => previousData ?? lastOxfordCollectionMeta ?? undefined,
  });

  useEffect(() => {
    if (query.data) {
      lastOxfordCollectionMeta = query.data;
    }
  }, [query.data]);

  return {
    error: toQueryErrorMessage(query.error, "Cannot load Oxford collection."),
    isLoading: query.isLoading && query.data == null,
    isFetching: query.isFetching,
    meta: query.data ?? null,
    reload: query.refetch,
  };
}

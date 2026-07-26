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
const lastOxfordCollectionMetaByUser = new Map<string, OxfordCollectionMeta>();

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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    for (const nextBand of OXFORD_BANDS) {
      void queryClient.prefetchQuery(getOxfordCollectionMetaQueryOptions(userId, nextBand));
    }
  }, [isAuthenticated, queryClient, userId]);

  const query = useQuery({
    ...getOxfordCollectionMetaQueryOptions(userId ?? "", band),
    enabled: enabled && isAuthenticated && Boolean(userId),
    placeholderData: (previousData) =>
      previousData ?? (userId ? lastOxfordCollectionMetaByUser.get(userId) : undefined),
  });

  useEffect(() => {
    if (query.data && userId) {
      lastOxfordCollectionMetaByUser.set(userId, query.data);
    }
  }, [query.data, userId]);

  return {
    error: toQueryErrorMessage(query.error, "Cannot load Oxford collection."),
    isLoading: query.isLoading && query.data == null,
    isFetching: query.isFetching,
    meta: query.data ?? null,
    reload: query.refetch,
  };
}

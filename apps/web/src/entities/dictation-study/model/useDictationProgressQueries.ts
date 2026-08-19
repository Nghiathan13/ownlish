"use client";

import { useQueries } from "@tanstack/react-query";
import { getDictationProgressQueryOptions } from "./progressQuery";

type UseDictationProgressQueriesParams = {
  enabled?: boolean;
  userId: string | null;
  videoIds: readonly string[];
};

export function useDictationProgressQueries({
  enabled = true,
  userId,
  videoIds,
}: UseDictationProgressQueriesParams) {
  return useQueries({
    queries: videoIds.map((videoId) => ({
      ...getDictationProgressQueryOptions(userId, videoId),
      enabled: enabled && Boolean(userId),
    })),
  });
}

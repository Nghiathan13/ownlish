"use client";

import { useQuery } from "@tanstack/react-query";
import { getDictationProgressQueryOptions } from "./progressQuery";

type UseDictationProgressQueryParams = {
  enabled?: boolean;
  userId: string | null;
  videoId: string;
};

export function useDictationProgressQuery({
  enabled = true,
  userId,
  videoId,
}: UseDictationProgressQueryParams) {
  return useQuery({
    ...getDictationProgressQueryOptions(userId, videoId),
    enabled: enabled && Boolean(userId),
  });
}

import type { QueryClient } from "@tanstack/react-query";
import { runAuthenticatedRequest } from "@/entities/session/@x/dictation-study";
import { getDictationProgress } from "../api/progress";
import { getDictationProgressQueryKey } from "./queries";
import type { DictationProgress } from "./types";

export const DICTATION_PROGRESS_STALE_TIME = Infinity;

export function getDictationProgressQueryOptions(
  userId: string | null,
  videoId: string,
) {
  return {
    queryKey: getDictationProgressQueryKey(userId, videoId),
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) => getDictationProgress(token, videoId),
      }),
    staleTime: DICTATION_PROGRESS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  };
}

export function setDictationProgressQueryData(
  queryClient: QueryClient,
  userId: string | null,
  progress: DictationProgress,
) {
  queryClient.setQueryData(
    getDictationProgressQueryKey(userId, progress.videoId),
    progress,
  );
}

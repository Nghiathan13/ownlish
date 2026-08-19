"use client";

import { useQuery } from "@tanstack/react-query";
import { getDictationVideo } from "../api/video";
import { getDictationVideoQueryKey } from "./queries";

export function useDictationVideoQuery(
  rootUrl: string | undefined,
  video: { id: string; path: string } | null,
) {
  return useQuery({
    queryKey: getDictationVideoQueryKey(video?.id ?? null),
    queryFn: ({ signal }) => getDictationVideo(rootUrl!, video!.path, { signal }),
    enabled: Boolean(rootUrl && video),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

import type { DictationCatalogVideo } from "./types";

export function getDictationCatalogQueryKey() {
  return ["dictation", "catalog"] as const;
}

export function getDictationVideoQueryKey(videoId: string | null) {
  return ["dictation", "video", videoId] as const;
}

export function getDictationProgressQueryKey(
  userId: string | null,
  videoId: string | null,
) {
  return ["dictation", "progress", userId, videoId] as const;
}

export function findDictationVideo(
  videos: DictationCatalogVideo[],
  videoId: string,
) {
  return videos.find((video) => video.id === videoId) ?? null;
}

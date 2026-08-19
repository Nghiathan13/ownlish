import type { DictationCatalogVideo } from "./types";

export function getDictationCatalogIndexQueryKey() {
  return ["dictation", "catalog-index"] as const;
}

export function getDictationCatalogQueryKey(catalogPath: string | null) {
  return ["dictation", "catalog", catalogPath] as const;
}

export function findDictationVideo(
  videos: DictationCatalogVideo[],
  videoId: string,
) {
  return videos.find((video) => video.id === videoId) ?? null;
}

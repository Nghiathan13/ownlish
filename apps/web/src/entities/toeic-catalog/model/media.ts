import type { ToeicCatalogSource } from "./types";

export function resolveToeicCatalogMediaUrl(
  source: ToeicCatalogSource,
  path: string | undefined,
): string | null {
  return path ? new URL(path, source.rootUrl).toString() : null;
}

export function resolveToeicCatalogGroupMedia(
  source: ToeicCatalogSource,
  groupKey: string | null | undefined,
) {
  const media = groupKey ? source.manifest.mediaByGroupId[groupKey] : undefined;

  return {
    audioUrl: resolveToeicCatalogMediaUrl(source, media?.audio),
    imageUrl: resolveToeicCatalogMediaUrl(source, media?.image),
  };
}

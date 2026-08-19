import type { DictationCatalogIndexCategory } from "../model/types";

export const DICTATION_WATCH_PATH = "/dictation/watch";

export const DICTATION_CATEGORIES = [
  { id: "bbc", label: "BBC", path: "catalogs/bbc.json" },
  { id: "music", label: "Music", path: "catalogs/music.json" },
] as const satisfies readonly DictationCatalogIndexCategory[];

export type DictationCategoryId = (typeof DICTATION_CATEGORIES)[number]["id"];

export const DEFAULT_DICTATION_CATEGORY_ID: DictationCategoryId =
  DICTATION_CATEGORIES[0].id;

export function parseDictationCategoryId(
  value: string | null,
): DictationCategoryId | null {
  return DICTATION_CATEGORIES.find((category) => category.id === value)?.id ?? null;
}

export function getDictationCategory(categoryId: DictationCategoryId) {
  return DICTATION_CATEGORIES.find((category) => category.id === categoryId)!;
}

export function getDictationCategoryPath(categoryId: string) {
  return `/dictation/${categoryId}`;
}

export function getDictationWatchPath(videoId: string) {
  const params = new URLSearchParams({ v: videoId });
  return `${DICTATION_WATCH_PATH}?${params.toString()}`;
}

export function parseDictationWatchVideoId(value: string | null) {
  if (value == null) {
    return null;
  }

  const videoId = value.trim();
  return videoId.length > 0 ? videoId : null;
}

export function findDictationCatalogCategory(
  categories: readonly DictationCatalogIndexCategory[],
  categoryId: string,
) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function findDictationCatalogCategoryByLabel(
  categories: readonly DictationCatalogIndexCategory[],
  label: string,
) {
  return categories.find((category) => category.label === label) ?? null;
}

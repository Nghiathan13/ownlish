import { DICTATION_CATALOG_ROOT } from "@/shared/config";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import type {
  DictationCatalog,
  DictationCatalogSource,
  DictationCatalogVideo,
} from "../model/types";

export function getDictationCatalogRootUrl() {
  if (!DICTATION_CATALOG_ROOT) {
    return null;
  }

  return DICTATION_CATALOG_ROOT.endsWith("/")
    ? DICTATION_CATALOG_ROOT
    : `${DICTATION_CATALOG_ROOT}/`;
}

function getCatalogRootUrl() {
  const rootUrl = getDictationCatalogRootUrl();
  if (!rootUrl) {
    throw new Error("Dictation catalog is not configured.");
  }

  return new URL(rootUrl);
}

async function fetchJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Cannot load Dictation catalog.");
  }

  return response.json() as Promise<unknown>;
}

function parseCatalogVideo(value: unknown): DictationCatalogVideo {
  if (!isRecord(value)) throw new Error("Invalid Dictation catalog.");

  const { category, durationSeconds, id, language, path, segmentCount, title, youtubeVideoId } = value;
  if (
    !isString(category) ||
    !category.trim() ||
    !isNumber(durationSeconds) ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 1 ||
    !isString(id) ||
    !isString(language) ||
    !isString(path) ||
    !isNumber(segmentCount) ||
    !Number.isInteger(segmentCount) ||
    segmentCount < 1 ||
    !isString(title) ||
    !isString(youtubeVideoId)
  ) {
    throw new Error("Invalid Dictation catalog.");
  }

  return { category, durationSeconds, id, language, path, segmentCount, title, youtubeVideoId };
}

function parseCatalog(value: unknown): DictationCatalog {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.videos)) {
    throw new Error("Invalid Dictation catalog.");
  }

  return { version: 1, videos: value.videos.map(parseCatalogVideo) };
}

export async function getDictationCatalog(
  catalogPath: string,
  options: { signal?: AbortSignal } = {},
): Promise<DictationCatalogSource> {
  const rootUrl = getCatalogRootUrl();
  const catalog = parseCatalog(
    await fetchJson(new URL(catalogPath, rootUrl), options.signal),
  );

  return { catalog, rootUrl: rootUrl.toString() };
}

export function getDictationThumbnailUrl(youtubeVideoId: string) {
  return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
}

import { DICTATION_CATALOG_ROOT } from "@/shared/config/env";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import type {
  DictationCatalog,
  DictationCatalogSource,
  DictationCatalogVideo,
  DictationSegment,
  DictationVideo,
} from "../model/types";

function getCatalogRootUrl() {
  if (!DICTATION_CATALOG_ROOT) {
    throw new Error("Dictation catalog is not configured.");
  }

  return new URL(
    DICTATION_CATALOG_ROOT.endsWith("/")
      ? DICTATION_CATALOG_ROOT
      : `${DICTATION_CATALOG_ROOT}/`,
  );
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

function parseSegment(value: unknown): DictationSegment {
  if (!isRecord(value)) throw new Error("Invalid Dictation video.");

  const { id, startMs, endMs, text } = value;
  if (
    !isString(id) ||
    !isNumber(startMs) ||
    !Number.isInteger(startMs) ||
    !isNumber(endMs) ||
    !Number.isInteger(endMs) ||
    endMs <= startMs ||
    !isString(text) ||
    !text.trim()
  ) {
    throw new Error("Invalid Dictation video.");
  }

  return { id, startMs, endMs, text };
}

function parseVideo(value: unknown): DictationVideo {
  if (!isRecord(value) || value.version !== 1 || value.status !== "approved") {
    throw new Error("Invalid Dictation video.");
  }

  const { segments, timing, video } = value;
  if (
    !Array.isArray(segments) ||
    !isRecord(timing) ||
    timing.granularity !== "segment" ||
    !isString(timing.source) ||
    !isRecord(video) ||
    !isString(video.category) ||
    !video.category.trim() ||
    !isNumber(video.durationSeconds) ||
    !Number.isInteger(video.durationSeconds) ||
    video.durationSeconds < 1 ||
    !isString(video.youtubeVideoId) ||
    !isString(video.language) ||
    !isString(video.title) ||
    !isString(video.url)
  ) {
    throw new Error("Invalid Dictation video.");
  }

  const parsedSegments = segments.map(parseSegment);
  if (new Set(parsedSegments.map((segment) => segment.id)).size !== parsedSegments.length) {
    throw new Error("Invalid Dictation video: segment IDs must be unique.");
  }

  return {
    version: 1,
    status: "approved",
    timing: { granularity: "segment", source: timing.source },
    video: {
      category: video.category,
      durationSeconds: video.durationSeconds,
      youtubeVideoId: video.youtubeVideoId,
      language: video.language,
      title: video.title,
      url: video.url,
    },
    segments: parsedSegments,
  };
}

export async function getDictationCatalog(
  options: { signal?: AbortSignal } = {},
): Promise<DictationCatalogSource> {
  const rootUrl = getCatalogRootUrl();
  const catalog = parseCatalog(
    await fetchJson(new URL("catalog.json", rootUrl), options.signal),
  );

  return { catalog, rootUrl: rootUrl.toString() };
}

export function getDictationVideo(
  source: DictationCatalogSource,
  video: DictationCatalogVideo,
  options: { signal?: AbortSignal } = {},
) {
  return fetchJson(new URL(video.path, source.rootUrl), options.signal).then(parseVideo);
}

export function getDictationThumbnailUrl(youtubeVideoId: string) {
  return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
}

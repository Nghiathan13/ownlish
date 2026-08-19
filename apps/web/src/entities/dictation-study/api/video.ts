import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import type { DictationSegment, DictationVideo } from "../model/types";

async function fetchJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Cannot load Dictation video.");
  }

  return response.json() as Promise<unknown>;
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

export function getDictationVideo(
  rootUrl: string,
  path: string,
  options: { signal?: AbortSignal } = {},
) {
  return fetchJson(new URL(path, rootUrl), options.signal).then(parseVideo);
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dictationCatalogRoot = vi.hoisted(() => ({ value: "https://content.example/dictation" }));

vi.mock("@/shared/config/env", () => ({
  get DICTATION_CATALOG_ROOT() {
    return dictationCatalogRoot.value;
  },
}));

import {
  getDictationCatalog,
  getDictationThumbnailUrl,
  getDictationVideo,
} from "./catalog";

const catalog = {
  version: 1,
  videos: [
    {
      category: "Music",
      durationSeconds: 120,
      id: "video-1",
      language: "en",
      path: "videos/video-1.json",
      segmentCount: 1,
      title: "Video one",
      youtubeVideoId: "youtube-1",
    },
  ],
};

const video = {
  version: 1,
  status: "approved",
  timing: { granularity: "segment", source: "manual" },
  video: {
    category: "Music",
    durationSeconds: 120,
    language: "en",
    title: "Video one",
    url: "https://www.youtube.com/watch?v=youtube-1",
    youtubeVideoId: "youtube-1",
  },
  segments: [{ id: "s001", startMs: 0, endMs: 1000, text: "Hello world" }],
};

function jsonResponse(value: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(value) } as Response;
}

describe("dictation catalog API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    dictationCatalogRoot.value = "https://content.example/dictation";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads a valid catalog from the configured root and forwards an abort signal", async () => {
    const signal = new AbortController().signal;
    vi.mocked(fetch).mockResolvedValue(jsonResponse(catalog));

    await expect(getDictationCatalog({ signal })).resolves.toEqual({
      catalog,
      rootUrl: "https://content.example/dictation/",
    });
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictation/catalog.json"),
      { cache: "no-store", signal },
    );
  });

  it("normalizes a root with a trailing slash and rejects unavailable or malformed catalogs", async () => {
    dictationCatalogRoot.value = "https://content.example/dictation/";
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(catalog));
    await expect(getDictationCatalog()).resolves.toMatchObject({
      rootUrl: "https://content.example/dictation/",
    });

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, false));
    await expect(getDictationCatalog()).rejects.toThrow("Cannot load Dictation catalog.");

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ version: 1, videos: [{}] }));
    await expect(getDictationCatalog()).rejects.toThrow("Invalid Dictation catalog.");
  });

  it("requires a configured root before issuing a request", async () => {
    dictationCatalogRoot.value = "";

    await expect(getDictationCatalog()).rejects.toThrow("Dictation catalog is not configured.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads a valid approved video and rejects invalid timing or duplicate segment IDs", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(video));
    const source = { catalog, rootUrl: "https://content.example/dictation/" };
    await expect(getDictationVideo(source, catalog.videos[0])).resolves.toEqual(video);
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictation/videos/video-1.json"),
      { cache: "no-store", signal: undefined },
    );

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ...video, timing: { granularity: "word", source: "manual" } }));
    await expect(getDictationVideo(source, catalog.videos[0])).rejects.toThrow("Invalid Dictation video.");

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      ...video,
      segments: [video.segments[0], { ...video.segments[0], endMs: 2000 }],
    }));
    await expect(getDictationVideo(source, catalog.videos[0])).rejects.toThrow(
      "Invalid Dictation video: segment IDs must be unique.",
    );
  });

  it("builds the official YouTube thumbnail URL", () => {
    expect(getDictationThumbnailUrl("video_id")).toBe(
      "https://i.ytimg.com/vi/video_id/hqdefault.jpg",
    );
  });
});

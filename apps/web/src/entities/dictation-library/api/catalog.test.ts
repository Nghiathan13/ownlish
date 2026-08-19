import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dictationCatalogRoot = vi.hoisted(() => ({ value: "https://content.example/dictation" }));

vi.mock("@/shared/config/env", () => ({
  get DICTATION_CATALOG_ROOT() {
    return dictationCatalogRoot.value;
  },
}));

import {
  getDictationCatalog,
  getDictationCatalogIndex,
  getDictationCatalogRootUrl,
  getDictationThumbnailUrl,
} from "./catalog";

const index = {
  version: 1,
  categories: [{ id: "music", label: "Music", path: "catalogs/music.json" }],
};

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

function jsonResponse(value: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(value) } as Response;
}

describe("dictation catalog API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    dictationCatalogRoot.value = "https://content.example/dictation";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("normalizes the configured catalog root", () => {
    expect(getDictationCatalogRootUrl()).toBe("https://content.example/dictation/");
    dictationCatalogRoot.value = "";
    expect(getDictationCatalogRootUrl()).toBeNull();
  });

  it("loads a valid catalog index and forwards an abort signal", async () => {
    const signal = new AbortController().signal;
    vi.mocked(fetch).mockResolvedValue(jsonResponse(index));

    await expect(getDictationCatalogIndex({ signal })).resolves.toEqual({
      index,
      rootUrl: "https://content.example/dictation/",
    });
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictation/index.json"),
      { cache: "no-store", signal },
    );
  });

  it("loads a category catalog from the index path", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(catalog));

    await expect(getDictationCatalog("catalogs/music.json")).resolves.toEqual({
      catalog,
      rootUrl: "https://content.example/dictation/",
    });
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictation/catalogs/music.json"),
      { cache: "no-store", signal: undefined },
    );
  });

  it("rejects unavailable or malformed catalogs", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, false));
    await expect(getDictationCatalog("catalogs/music.json")).rejects.toThrow(
      "Cannot load Dictation catalog.",
    );

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ version: 1, videos: [{}] }));
    await expect(getDictationCatalog("catalogs/music.json")).rejects.toThrow(
      "Invalid Dictation catalog.",
    );

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ version: 1, categories: [{}] }));
    await expect(getDictationCatalogIndex()).rejects.toThrow(
      "Invalid Dictation catalog index.",
    );
  });

  it("requires a configured root before issuing a request", async () => {
    dictationCatalogRoot.value = "";

    await expect(getDictationCatalogIndex()).rejects.toThrow(
      "Dictation catalog is not configured.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("builds the official YouTube thumbnail URL", () => {
    expect(getDictationThumbnailUrl("video_id")).toBe(
      "https://i.ytimg.com/vi/video_id/hqdefault.jpg",
    );
  });
});

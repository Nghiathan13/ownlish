import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dictationCatalogRoot = vi.hoisted(() => ({ value: "https://content.example/dictation" }));

vi.mock("@/shared/config/env", () => ({
  get DICTATION_CATALOG_ROOT() {
    return dictationCatalogRoot.value;
  },
}));

import {
  getDictationCatalog,
  getDictationCatalogRootUrl,
  getDictationThumbnailUrl,
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

  it("loads a category catalog from the category path", async () => {
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
  });

  it("requires a configured root before issuing a request", async () => {
    dictationCatalogRoot.value = "";

    await expect(getDictationCatalog("catalogs/music.json")).rejects.toThrow(
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

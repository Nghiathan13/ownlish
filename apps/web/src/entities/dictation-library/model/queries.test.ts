import { describe, expect, it } from "vitest";
import { findDictationVideo, getDictationCatalogQueryKey } from "./queries";

describe("dictation library query helpers", () => {
  it("builds a stable category catalog query key", () => {
    expect(getDictationCatalogQueryKey("catalogs/bbc.json")).toEqual([
      "dictation",
      "catalog",
      "catalogs/bbc.json",
    ]);
  });

  it("finds a matching video or returns null", () => {
    const videos = [
      {
        category: "Music",
        durationSeconds: 120,
        id: "video-1",
        language: "en",
        path: "videos/video-1.json",
        segmentCount: 3,
        title: "Video one",
        youtubeVideoId: "youtube-1",
      },
    ];

    expect(findDictationVideo(videos, "video-1")).toBe(videos[0]);
    expect(findDictationVideo(videos, "missing")).toBeNull();
  });
});

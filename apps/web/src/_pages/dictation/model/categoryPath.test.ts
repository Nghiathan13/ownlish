import { describe, expect, it } from "vitest";
import { getDictationCategoryPath } from "./categoryPath";
import {
  findDictationVideo,
  getDictationCatalogQueryKey,
  getDictationProgressQueryKey,
  getDictationVideoQueryKey,
} from "./queries";

describe("dictation navigation helpers", () => {
  it("maps known categories and falls back to the catalog", () => {
    expect(getDictationCategoryPath("Music")).toBe("/dictation/music");
    expect(getDictationCategoryPath("BBC")).toBe("/dictation/bbc");
    expect(getDictationCategoryPath("Podcast")).toBe("/dictation");
  });

  it("builds stable catalog, video, and progress query keys", () => {
    expect(getDictationCatalogQueryKey()).toEqual(["dictation", "catalog"]);
    expect(getDictationVideoQueryKey("video-1")).toEqual(["dictation", "video", "video-1"]);
    expect(getDictationProgressQueryKey("user-1", "video-1")).toEqual([
      "dictation",
      "progress",
      "user-1",
      "video-1",
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

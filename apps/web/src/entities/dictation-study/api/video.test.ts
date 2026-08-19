import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDictationVideo } from "./video";

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

describe("dictation video API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads a valid approved video from the catalog root and path", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(video));

    await expect(
      getDictationVideo("https://content.example/dictation/", "videos/video-1.json"),
    ).resolves.toEqual(video);
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictation/videos/video-1.json"),
      { cache: "no-store", signal: undefined },
    );
  });

  it("rejects invalid timing or duplicate segment IDs", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ ...video, timing: { granularity: "word", source: "manual" } }),
    );
    await expect(
      getDictationVideo("https://content.example/dictation/", "videos/video-1.json"),
    ).rejects.toThrow("Invalid Dictation video.");

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        ...video,
        segments: [video.segments[0], { ...video.segments[0], endMs: 2000 }],
      }),
    );
    await expect(
      getDictationVideo("https://content.example/dictation/", "videos/video-1.json"),
    ).rejects.toThrow("Invalid Dictation video: segment IDs must be unique.");
  });

  it("rejects an unavailable video document", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, false));

    await expect(
      getDictationVideo("https://content.example/dictation/", "videos/video-1.json"),
    ).rejects.toThrow("Cannot load Dictation video.");
  });
});

import { describe, expect, it } from "vitest";
import { resolveToeicCatalogGroupMedia } from "./media";

const source = {
  rootUrl: "https://content.example/toeic/",
  manifest: {
    schemaVersion: 1 as const,
    tests: [],
    partPractice: [],
    mediaByGroupId: {
      group: { audio: "audio/group.mp3", image: "images/group.jpg" },
      imageOnly: { image: "images/only.jpg" },
    },
  },
};

describe("resolveToeicCatalogGroupMedia", () => {
  it("resolves both media URLs for a known group", () => {
    expect(resolveToeicCatalogGroupMedia(source, "group")).toEqual({
      audioUrl: "https://content.example/toeic/audio/group.mp3",
      imageUrl: "https://content.example/toeic/images/group.jpg",
    });
  });

  it("returns null for absent groups and missing media", () => {
    expect(resolveToeicCatalogGroupMedia(source, "imageOnly")).toEqual({
      audioUrl: null,
      imageUrl: "https://content.example/toeic/images/only.jpg",
    });
    expect(resolveToeicCatalogGroupMedia(source, null)).toEqual({ audioUrl: null, imageUrl: null });
  });
});

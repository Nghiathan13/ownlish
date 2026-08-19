import { describe, expect, it } from "vitest";
import {
  DEFAULT_DICTATION_CATEGORY_ID,
  DICTATION_CATEGORIES,
  findDictationCatalogCategory,
  findDictationCatalogCategoryByLabel,
  getDictationCategoryPath,
  getDictationWatchPath,
  parseDictationCategoryId,
  parseDictationWatchVideoId,
} from "./categoryPath";

const categories = [
  { id: "bbc", label: "BBC", path: "catalogs/bbc.json" },
  { id: "music", label: "Music", path: "catalogs/music.json" },
];

describe("dictation category helpers", () => {
  it("builds a category library path from the category id", () => {
    expect(getDictationCategoryPath("music")).toBe("/dictation/music");
    expect(getDictationCategoryPath("bbc")).toBe("/dictation/bbc");
    expect(DEFAULT_DICTATION_CATEGORY_ID).toBe(DICTATION_CATEGORIES[0].id);
    expect(parseDictationCategoryId("bbc")).toBe("bbc");
    expect(parseDictationCategoryId("podcast")).toBeNull();
  });

  it("builds and parses the watch query URL", () => {
    expect(getDictationWatchPath("7BIp53who2A")).toBe(
      "/dictation/watch?v=7BIp53who2A",
    );
    expect(parseDictationWatchVideoId("7BIp53who2A")).toBe("7BIp53who2A");
    expect(parseDictationWatchVideoId(null)).toBeNull();
    expect(parseDictationWatchVideoId("  ")).toBeNull();
  });

  it("finds a category by id or label", () => {
    expect(findDictationCatalogCategory(categories, "music")).toEqual(
      categories[1],
    );
    expect(findDictationCatalogCategory(categories, "podcast")).toBeNull();
    expect(findDictationCatalogCategoryByLabel(categories, "BBC")).toEqual(
      categories[0],
    );
    expect(findDictationCatalogCategoryByLabel(categories, "Podcast")).toBeNull();
  });
});

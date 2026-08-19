import { describe, expect, it } from "vitest";
import {
  findDictationCatalogCategory,
  findDictationCatalogCategoryByLabel,
  getDictationCategoryPath,
} from "./categoryPath";

const categories = [
  { id: "bbc", label: "BBC", path: "catalogs/bbc.json" },
  { id: "music", label: "Music", path: "catalogs/music.json" },
];

describe("dictation category helpers", () => {
  it("builds a category library path from the category id", () => {
    expect(getDictationCategoryPath("music")).toBe("/dictation/music");
    expect(getDictationCategoryPath("bbc")).toBe("/dictation/bbc");
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

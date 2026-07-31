import { describe, expect, it, vi } from "vitest";
import { getAddWordModalTitleParts } from "./addWordModalTitle";

describe("getAddWordModalTitleParts", () => {
  it("separates the muted add-word prefix from the current collection name", () => {
    const t = vi.fn(() => "Add word to");

    expect(getAddWordModalTitleParts("My vocabulary", t)).toEqual({
      collectionName: "My vocabulary",
      prefix: "Add word to",
    });
    expect(t).toHaveBeenCalledWith("wordsTable.addWordToCollectionPrefix");
  });
});

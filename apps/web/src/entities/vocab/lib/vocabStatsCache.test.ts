import { describe, expect, it } from "vitest";
import { getVocabStatsQueryKey } from "./vocabStatsCache";

describe("getVocabStatsQueryKey", () => {
  it("builds a stable user and collection scoped stats query key", () => {
    expect(getVocabStatsQueryKey("user-id", "collection-id")).toEqual([
      "vocab-stats",
      { userId: "user-id", collectionId: "collection-id" },
    ]);
  });

  it("supports a null user id", () => {
    expect(getVocabStatsQueryKey(null)).toEqual([
      "vocab-stats",
      { userId: null, collectionId: null },
    ]);
  });
});

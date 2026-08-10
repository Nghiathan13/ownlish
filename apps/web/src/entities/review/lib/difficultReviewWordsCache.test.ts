import { describe, expect, it, vi } from "vitest";
import {
  getDifficultReviewWordsQueryKey,
  invalidateDifficultReviewWords,
} from "./difficultReviewWordsCache";

describe("difficult review word cache", () => {
  it("creates source-specific query keys", () => {
    expect(getDifficultReviewWordsQueryKey("user-1")).toEqual([
      "difficult-review-words",
      { userId: "user-1", source: "collection" },
    ]);
    expect(getDifficultReviewWordsQueryKey("user-1", "oxford")).toEqual([
      "difficult-review-words",
      { userId: "user-1", source: "oxford" },
    ]);
  });

  it("invalidates only cached words for the given user", () => {
    const invalidateQueries = vi.fn();
    invalidateDifficultReviewWords({ invalidateQueries } as never, "user-1");

    const [{ queryKey, predicate }] = invalidateQueries.mock.calls[0];
    expect(queryKey).toEqual(["difficult-review-words"]);
    expect(predicate({ queryKey: ["difficult-review-words", { userId: "user-1" }] })).toBe(true);
    expect(predicate({ queryKey: ["difficult-review-words", { userId: "user-2" }] })).toBe(false);
    expect(predicate({ queryKey: ["different"] })).toBe(false);
  });
});

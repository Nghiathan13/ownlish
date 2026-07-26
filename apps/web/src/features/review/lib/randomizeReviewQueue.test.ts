import { describe, expect, it, vi } from "vitest";
import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import { randomizeReviewQueue } from "./randomizeReviewQueue";

function makeItem(id: string): VocabReviewItem {
  return { id } as VocabReviewItem;
}

describe("randomizeReviewQueue", () => {
  it("assigns a random order once and keeps it after an item is removed", () => {
    const ranks = new Map<string, number>();
    const random = vi
      .fn()
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.5);

    const items = [makeItem("one"), makeItem("two"), makeItem("three")];
    const ordered = randomizeReviewQueue(items, ranks, random);
    const remaining = randomizeReviewQueue(
      ordered.filter((item) => item.id !== "two"),
      ranks,
      random,
    );

    expect(ordered.map((item) => item.id)).toEqual(["two", "three", "one"]);
    expect(remaining.map((item) => item.id)).toEqual(["three", "one"]);
    expect(random).toHaveBeenCalledTimes(3);
  });
});

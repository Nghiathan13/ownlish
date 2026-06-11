import { describe, expect, it } from "vitest";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { buildReviewUpdate, getDaysForLevel } from "./reviewSchedule";

const REVIEWED_AT = new Date("2026-01-01T00:00:00.000Z");

function makeWord(overrides: Partial<VocabWord> = {}): VocabWord {
  return {
    id: "word-id",
    userId: "user-id",
    word: "example",
    normalizedWord: "example",
    ipa: null,
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    band: null,
    level: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("getDaysForLevel", () => {
  it("returns the review interval for each learning level", () => {
    expect(getDaysForLevel(0)).toBe(2);
    expect(getDaysForLevel(1)).toBe(4);
    expect(getDaysForLevel(2)).toBe(7);
    expect(getDaysForLevel(3)).toBe(15);
    expect(getDaysForLevel(4)).toBe(30);
    expect(getDaysForLevel(5)).toBe(60);
    expect(getDaysForLevel(6)).toBe(60);
  });
});

describe("buildReviewUpdate", () => {
  it("moves a remembered word up one level and clears wrong count", () => {
    expect(
      buildReviewUpdate(
        makeWord({
          level: 2,
          wrongCount: 3,
        }),
        "remember",
        REVIEWED_AT,
      ),
    ).toEqual({
      level: 3,
      wrongCount: 0,
      lastReview: "2026-01-01T00:00:00.000Z",
      nextReview: "2026-01-08T00:00:00.000Z",
    });
  });

  it("marks level 7 remembered words as mastered with no next review", () => {
    expect(
      buildReviewUpdate(
        makeWord({
          level: 6,
          wrongCount: 1,
        }),
        "remember",
        REVIEWED_AT,
      ),
    ).toEqual({
      level: 7,
      wrongCount: 0,
      lastReview: "2026-01-01T00:00:00.000Z",
      nextReview: null,
    });
  });

  it("moves a forgotten word down two levels and increments wrong count", () => {
    expect(
      buildReviewUpdate(
        makeWord({
          level: 5,
          wrongCount: 2,
        }),
        "forgot",
        REVIEWED_AT,
      ),
    ).toEqual({
      level: 3,
      wrongCount: 3,
      lastReview: "2026-01-01T00:00:00.000Z",
      nextReview: "2026-01-08T00:00:00.000Z",
    });
  });

  it("keeps forgotten low-level words at level 0 and reviews them tomorrow", () => {
    expect(
      buildReviewUpdate(
        makeWord({
          level: 1,
          wrongCount: 0,
        }),
        "forgot",
        REVIEWED_AT,
      ),
    ).toEqual({
      level: 0,
      wrongCount: 1,
      lastReview: "2026-01-01T00:00:00.000Z",
      nextReview: "2026-01-02T00:00:00.000Z",
    });
  });
});

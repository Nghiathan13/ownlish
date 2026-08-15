import { describe, expect, it } from "vitest";
import type { OxfordProgressSummary } from "@/entities/collection";
import type { VocabStats } from "@/entities/vocab";
import {
  EMPTY_PROGRESS,
  mergeOxfordProgress,
  mergeVocabStats,
  toCollectionProgress,
} from "./reviewProgress";

function makeVocabStats(partial: Partial<VocabStats> & Pick<VocabStats, "levels">): VocabStats {
  return {
    total: partial.total ?? 0,
    due: partial.due ?? 0,
    mastered: partial.mastered ?? 0,
    highWrongCount: partial.highWrongCount ?? 0,
    levels: partial.levels,
  };
}

function makeOxfordSummary(
  partial: Partial<OxfordProgressSummary> = {},
): OxfordProgressSummary {
  return {
    total: partial.total ?? 0,
    masteredCount: partial.masteredCount ?? 0,
    learningCount: partial.learningCount ?? 0,
    newCount: partial.newCount ?? 0,
    levelCounts:
      partial.levelCounts ??
      Array.from({ length: 7 }, (_, index) => ({
        level: index + 1,
        count: 0,
      })),
  };
}

describe("EMPTY_PROGRESS", () => {
  it("is a zeroed summary with levels 1–7", () => {
    expect(EMPTY_PROGRESS).toEqual({
      total: 0,
      masteredCount: 0,
      learningCount: 0,
      newCount: 0,
      levelCounts: [
        { level: 1, count: 0 },
        { level: 2, count: 0 },
        { level: 3, count: 0 },
        { level: 4, count: 0 },
        { level: 5, count: 0 },
        { level: 6, count: 0 },
        { level: 7, count: 0 },
      ],
    });
  });
});

describe("mergeVocabStats", () => {
  it("sums totals and merges level counts, sorting by level", () => {
    const left = makeVocabStats({
      total: 10,
      due: 2,
      mastered: 3,
      highWrongCount: 1,
      levels: [
        { level: 2, count: 4 },
        { level: 0, count: 3 },
      ],
    });
    const right = makeVocabStats({
      total: 5,
      due: 1,
      mastered: 2,
      highWrongCount: 4,
      levels: [
        { level: 0, count: 1 },
        { level: 7, count: 2 },
        { level: 2, count: 1 },
      ],
    });

    expect(mergeVocabStats([left, right])).toEqual({
      total: 15,
      due: 3,
      mastered: 5,
      highWrongCount: 5,
      levels: [
        { level: 0, count: 4 },
        { level: 2, count: 5 },
        { level: 7, count: 2 },
      ],
    });
  });

  it("returns zeros for an empty list", () => {
    expect(mergeVocabStats([])).toEqual({
      total: 0,
      due: 0,
      mastered: 0,
      highWrongCount: 0,
      levels: [],
    });
  });
});

describe("mergeOxfordProgress", () => {
  it("sums summaries and fills missing levels with zero", () => {
    const left = makeOxfordSummary({
      total: 20,
      masteredCount: 5,
      learningCount: 10,
      newCount: 5,
      levelCounts: [
        { level: 1, count: 3 },
        { level: 3, count: 7 },
      ],
    });
    const right = makeOxfordSummary({
      total: 8,
      masteredCount: 2,
      learningCount: 4,
      newCount: 2,
      levelCounts: [
        { level: 1, count: 1 },
        { level: 7, count: 2 },
      ],
    });

    expect(mergeOxfordProgress([left, right])).toEqual({
      total: 28,
      masteredCount: 7,
      learningCount: 14,
      newCount: 7,
      levelCounts: [
        { level: 1, count: 4 },
        { level: 2, count: 0 },
        { level: 3, count: 7 },
        { level: 4, count: 0 },
        { level: 5, count: 0 },
        { level: 6, count: 0 },
        { level: 7, count: 2 },
      ],
    });
  });

  it("returns empty progress for an empty list", () => {
    expect(mergeOxfordProgress([])).toEqual(EMPTY_PROGRESS);
  });
});

describe("toCollectionProgress", () => {
  it("maps null stats to empty progress", () => {
    expect(toCollectionProgress(null)).toEqual(EMPTY_PROGRESS);
  });

  it("splits levels into new, learning, mastered buckets", () => {
    const stats = makeVocabStats({
      total: 20,
      mastered: 4,
      levels: [
        { level: 0, count: 5 },
        { level: 1, count: 2 },
        { level: 3, count: 3 },
        { level: 6, count: 1 },
        { level: 7, count: 4 },
      ],
    });

    expect(toCollectionProgress(stats)).toEqual({
      total: 20,
      masteredCount: 4,
      learningCount: 6,
      newCount: 5,
      levelCounts: [
        { level: 1, count: 2 },
        { level: 2, count: 0 },
        { level: 3, count: 3 },
        { level: 4, count: 0 },
        { level: 5, count: 0 },
        { level: 6, count: 1 },
        { level: 7, count: 4 },
      ],
    });
  });

  it("treats missing level rows as zero", () => {
    const stats = makeVocabStats({
      total: 3,
      mastered: 0,
      levels: [],
    });

    expect(toCollectionProgress(stats)).toEqual({
      total: 3,
      masteredCount: 0,
      learningCount: 0,
      newCount: 0,
      levelCounts: EMPTY_PROGRESS.levelCounts,
    });
  });
});

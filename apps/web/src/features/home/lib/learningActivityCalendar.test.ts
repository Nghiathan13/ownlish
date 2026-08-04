import { afterEach, describe, expect, it, vi } from "vitest";
import { LEARNING_ACTIVITY_TYPES } from "@/entities/learning-activity";
import {
  formatLearningActivityPeriodRange,
  getCurrentLearningStreak,
  getLearningActivityPeriods,
  getLearningActivitySecondsByDate,
  getNavigableLearningActivityPeriods,
} from "./learningActivityCalendar";

const days = [
  {
    activityType: LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
    learnedOn: "2026-07-29",
    seconds: 60,
  },
  {
    activityType: LEARNING_ACTIVITY_TYPES.TEST_REVIEW_WRONG,
    learnedOn: "2026-07-29",
    seconds: 90,
  },
  {
    activityType: LEARNING_ACTIVITY_TYPES.TEST_PART_PRACTICE,
    learnedOn: "2026-07-28",
    seconds: 120,
  },
  {
    activityType: LEARNING_ACTIVITY_TYPES.DICTATION,
    learnedOn: "2026-01-01",
    seconds: 180,
  },
];

describe("learning activity calendar selectors", () => {
  afterEach(() => vi.useRealTimers());

  it("filters daily seconds locally by mode", () => {
    expect(getLearningActivitySecondsByDate(days, "practice")).toEqual(
      new Map([["2026-07-29", 150]]),
    );
    expect(getLearningActivitySecondsByDate(days)).toEqual(
      new Map([
        ["2026-07-29", 150],
        ["2026-07-28", 120],
        ["2026-01-01", 180],
      ]),
    );
  });

  it("keeps yesterday's streak during an unstudied today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T10:00:00.000Z"));

    expect(getCurrentLearningStreak(days)).toBe(2);
  });

  it("derives every available half-year locally", () => {
    expect(getLearningActivityPeriods(days)).toEqual(["2026-2", "2026-1"]);
  });

  it("includes the current empty half-year among navigable periods", () => {
    expect(getNavigableLearningActivityPeriods(days, "2027-1")).toEqual([
      "2026-1",
      "2026-2",
      "2027-1",
    ]);
    expect(getNavigableLearningActivityPeriods([], "2026-2")).toEqual([
      "2026-2",
    ]);
  });

  it("formats half-year ranges for heatmap navigation", () => {
    expect(formatLearningActivityPeriodRange("2026-2", "en")).toBe(
      "Jul to Dec 2026",
    );
    expect(formatLearningActivityPeriodRange("2026-1", "en")).toBe(
      "Jan to Jun 2026",
    );
    expect(formatLearningActivityPeriodRange("2026-2", "vi")).toBe(
      "Thg 7 đến Thg 12 2026",
    );
    expect(formatLearningActivityPeriodRange("2026-1", "vi")).toBe(
      "Thg 1 đến Thg 6 2026",
    );
  });
});

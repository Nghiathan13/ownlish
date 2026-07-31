import { afterEach, describe, expect, it, vi } from "vitest";
import { LEARNING_ACTIVITY_TYPES } from "@/entities/learning-activity";
import {
  getCurrentLearningStreak,
  getLearningActivityPeriods,
  getLearningActivitySecondsByDate,
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
});

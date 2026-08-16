import { describe, expect, it } from "vitest";
import {
  getCurrentLeaderboardPeriod,
  getLeaderboardLocation,
  getLeaderboardPath,
  getLeaderboardPeriodLocation,
  getNextLeaderboardLocation,
  getPreviousLeaderboardLocation,
} from "./leaderboardLocation";

const now = new Date("2026-08-16T10:00:00.000Z");

describe("leaderboard location", () => {
  it("normalizes invalid and future date state to the current Vietnam week", () => {
    expect(
      getLeaderboardLocation(
        { metric: "study-time", period: "week", anchor: "2026-08-17" },
        now,
      ),
    ).toEqual({
      metric: "study-time",
      period: "week",
      anchor: "2026-08-10",
    });
  });

  it("drops range state for Experience and malformed anchors", () => {
    expect(
      getLeaderboardLocation(
        { metric: "experience", period: "week", anchor: "2026-08-10" },
        now,
      ),
    ).toEqual({ metric: "experience", period: "week", anchor: null });
    expect(
      getLeaderboardLocation(
        { metric: "study-time", period: "month", anchor: "2026-08-32" },
        now,
      ),
    ).toEqual({
      metric: "study-time",
      period: "month",
      anchor: "2026-08-01",
    });
  });

  it("builds a shareable study-time path and an experience path without range data", () => {
    expect(
      getLeaderboardPath({
        metric: "study-time",
        period: "month",
        anchor: "2026-08-01",
      }),
    ).toBe("/dashboard/leaderboard?metric=study-time&period=month&anchor=2026-08-01");
    expect(
      getLeaderboardPath({ metric: "experience", period: "all", anchor: null }),
    ).toBe("/dashboard/leaderboard?metric=experience");
  });

  it("navigates ISO weeks and locks the current period from future navigation", () => {
    const location = {
      metric: "study-time" as const,
      period: "week" as const,
      anchor: "2026-08-10",
    };

    expect(getPreviousLeaderboardLocation(location)).toEqual({
      ...location,
      anchor: "2026-08-03",
    });
    expect(getNextLeaderboardLocation(location, now)).toBeNull();
    expect(
      getNextLeaderboardLocation(
        { ...location, anchor: "2026-08-03" },
        now,
      ),
    ).toEqual(location);
    expect(
      getNextLeaderboardLocation(
        { metric: "study-time", period: "month", anchor: "2026-07-01" },
        now,
      ),
    ).toEqual({
      metric: "study-time",
      period: "month",
      anchor: "2026-08-01",
    });
  });

  it("resets every finite-period selection to the current Vietnam range", () => {
    expect(
      getLeaderboardPeriodLocation(
        {
          metric: "study-time",
          period: "week",
          anchor: "2026-08-03",
        },
        "month",
        now,
      ),
    ).toEqual({
      metric: "study-time",
      period: "month",
      anchor: "2026-08-01",
    });
    expect(
      getLeaderboardPeriodLocation(
        {
          metric: "study-time",
          period: "month",
          anchor: "2026-07-01",
        },
        "week",
        now,
      ),
    ).toEqual({
      metric: "study-time",
      period: "week",
      anchor: "2026-08-10",
    });
  });

  it("keeps an already selected period unchanged", () => {
    const historicalWeek = {
      metric: "study-time" as const,
      period: "week" as const,
      anchor: "2026-08-03",
    };

    expect(
      getLeaderboardPeriodLocation(historicalWeek, "week", now),
    ).toEqual(historicalWeek);
  });

  it("identifies the current period without treating historical ranges as current", () => {
    expect(
      getCurrentLeaderboardPeriod(
        { metric: "study-time", period: "week", anchor: "2026-08-10" },
        now,
      ),
    ).toBe("week");
    expect(
      getCurrentLeaderboardPeriod(
        { metric: "study-time", period: "month", anchor: "2026-07-01" },
        now,
      ),
    ).toBeNull();
  });
});

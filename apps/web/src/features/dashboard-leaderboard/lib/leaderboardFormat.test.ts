import { describe, expect, it } from "vitest";
import { formatLeaderboardPeriod, formatStudyTime } from "./leaderboardFormat";

describe("leaderboard formatters", () => {
  it("formats study time without exposing raw seconds", () => {
    expect(formatStudyTime(7_500, "en")).toBe("2 h 5 min");
    expect(formatStudyTime(7_500, "vi")).toBe("2 giờ 5 phút");
  });

  it("formats an anchored week and month in the selected locale", () => {
    expect(
      formatLeaderboardPeriod(
        { metric: "study-time", period: "week", anchor: "2026-08-10" },
        "en",
      ),
    ).toBe("Aug 10 – Aug 16");
    expect(
      formatLeaderboardPeriod(
        { metric: "study-time", period: "month", anchor: "2026-08-01" },
        "vi",
      ),
    ).toBe("tháng 8 năm 2026");
  });

  it("uses an all-time label when a range does not have an anchor", () => {
    expect(
      formatLeaderboardPeriod(
        { metric: "study-time", period: "all", anchor: null },
        "en",
      ),
    ).toBe("All time");
  });
});

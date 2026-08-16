import { describe, expect, it } from "vitest";
import {
  toExperienceLeaderboardListEntries,
  toStudyTimeLeaderboardListEntries,
} from "./leaderboardList";

describe("leaderboard list view models", () => {
  it("formats study time and Experience before presentation", () => {
    expect(
      toStudyTimeLeaderboardListEntries(
        [{ rank: 1, displayName: "Linh", avatarUrl: null, studySeconds: 7_500 }],
        "en",
      ),
    ).toEqual([
      { rank: 1, displayName: "Linh", avatarUrl: null, value: "2 h 5 min" },
    ]);
    expect(
      toExperienceLeaderboardListEntries(
        [{ rank: 1, displayName: "Linh", avatarUrl: null, experience: 880 }],
        "vi",
      ),
    ).toEqual([
      { rank: 1, displayName: "Linh", avatarUrl: null, value: "880 XP" },
    ]);
  });
});

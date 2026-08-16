import { describe, expect, it, vi } from "vitest";

const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));
vi.mock("@/shared/api/http", () => ({ invalidApiResponse }));

import { parseExperienceLeaderboard } from "./getExperienceLeaderboard";

describe("Experience leaderboard API", () => {
  it("accepts only ranked public identity and XP fields", () => {
    expect(
      parseExperienceLeaderboard({
        entries: [
          { rank: 1, displayName: "Linh", avatarUrl: null, experience: 880 },
        ],
      }),
    ).toEqual({
      entries: [
        { rank: 1, displayName: "Linh", avatarUrl: null, experience: 880 },
      ],
    });
    expect(() => parseExperienceLeaderboard({ entries: [{ rank: 1 }] })).toThrow(
      "invalid",
    );
  });
});

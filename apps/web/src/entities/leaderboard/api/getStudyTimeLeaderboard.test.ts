import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.hoisted(() => vi.fn());
const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));

vi.mock("@/shared/api", () => ({ apiRequest, invalidApiResponse }));

import {
  getStudyTimeLeaderboard,
  parseStudyTimeLeaderboard,
} from "./getStudyTimeLeaderboard";

describe("study-time leaderboard API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("parses public entries and sends the requested range", async () => {
    apiRequest.mockResolvedValue({
      period: "week",
      startsOn: "2026-08-10",
      endsOn: "2026-08-16",
      entries: [
        {
          rank: 1,
          displayName: "Linh",
          avatarUrl: "https://assets.example/avatar.png",
          studySeconds: 7200,
        },
      ],
    });

    await expect(
      getStudyTimeLeaderboard("token", {
        period: "week",
        anchor: "2026-08-10",
      }),
    ).resolves.toEqual({
      period: "week",
      startsOn: "2026-08-10",
      endsOn: "2026-08-16",
      entries: [
        {
          rank: 1,
          displayName: "Linh",
          avatarUrl: "https://assets.example/avatar.png",
          studySeconds: 7200,
        },
      ],
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/leaderboard/study-time?period=week&anchor=2026-08-10",
      { signal: undefined, token: "token" },
    );
  });

  it("rejects entries that contain private or malformed fields instead of the contract", () => {
    expect(() =>
      parseStudyTimeLeaderboard({
        period: "all",
        startsOn: null,
        endsOn: null,
        entries: [{ rank: 1, email: "private@example.com" }],
      }),
    ).toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });

  it("rejects malformed top-level fields and unsupported periods", () => {
    expect(() =>
      parseStudyTimeLeaderboard({
        period: "year",
        startsOn: null,
        endsOn: null,
        entries: [],
      }),
    ).toThrow("invalid");
    expect(() =>
      parseStudyTimeLeaderboard({
        period: "all",
        startsOn: 1,
        endsOn: null,
        entries: [],
      }),
    ).toThrow("invalid");
    expect(() => parseStudyTimeLeaderboard(null)).toThrow("invalid");
  });

  it("omits an anchor for all-time requests", async () => {
    apiRequest.mockResolvedValue({
      period: "all",
      startsOn: null,
      endsOn: null,
      entries: [],
    });

    await getStudyTimeLeaderboard("token", { period: "all", anchor: null });

    expect(apiRequest).toHaveBeenCalledWith("/leaderboard/study-time?period=all", {
      signal: undefined,
      token: "token",
    });
  });
});

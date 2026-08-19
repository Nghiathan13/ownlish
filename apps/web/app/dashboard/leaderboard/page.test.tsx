import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/dashboard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/_pages/dashboard")>();

  return {
    ...actual,
    DashboardLeaderboardPage: ({
      metric,
    }: {
      metric: string;
    }) => <div data-metric={metric} />,
  };
});

import DashboardLeaderboardRoute from "./page";

describe("DashboardLeaderboardRoute", () => {
  it("passes a valid metric to the leaderboard page", async () => {
    const page = await DashboardLeaderboardRoute({
      searchParams: Promise.resolve({
        anchor: "2026-08-10",
        metric: "study-time",
        period: "week",
      }),
    });

    expect(page.props).toMatchObject({
      anchorParam: "2026-08-10",
      metric: "study-time",
      periodParam: "week",
    });
  });

  it("redirects a missing or invalid metric to the default leaderboard URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      DashboardLeaderboardRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith(
      "/dashboard/leaderboard?metric=study-time&period=all",
    );

    await expect(
      DashboardLeaderboardRoute({
        searchParams: Promise.resolve({ metric: "unknown" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith(
      "/dashboard/leaderboard?metric=study-time&period=all",
    );
  });
});

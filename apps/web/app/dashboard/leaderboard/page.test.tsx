import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import DashboardLeaderboardRoute from "./page";

describe("DashboardLeaderboardRoute", () => {
  it("passes only single URL values to the dashboard page", async () => {
    const page = await DashboardLeaderboardRoute({
      searchParams: Promise.resolve({
        anchor: "2026-08-10",
        metric: "study-time",
        period: "week",
      }),
    });

    expect(page.props).toMatchObject({
      anchorParam: "2026-08-10",
      metricParam: "study-time",
      periodParam: "week",
    });
  });

  it("redirects a bare route to the canonical default URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      DashboardLeaderboardRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith(
      "/dashboard/leaderboard?metric=study-time&period=all",
    );
  });
});

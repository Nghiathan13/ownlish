import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLeaderboardSkeleton } from "./DashboardLeaderboardSkeleton";

describe("DashboardLeaderboardSkeleton", () => {
  it("renders a decorative loading placeholder for the leaderboard list", () => {
    const { container } = render(<DashboardLeaderboardSkeleton />);

    expect(container.firstChild).toHaveAttribute("aria-hidden");
    expect(container.querySelectorAll(".h-12").length).toBe(8);
  });
});

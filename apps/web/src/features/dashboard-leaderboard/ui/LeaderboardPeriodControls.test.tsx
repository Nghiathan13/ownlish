import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LeaderboardPeriodControls } from "./LeaderboardPeriodControls";

describe("LeaderboardPeriodControls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("offers canonical period URLs and disables forward navigation for the current period", () => {
    render(
      <LocaleProvider>
        <LeaderboardPeriodControls
          location={{
            metric: "study-time",
            period: "week",
            anchor: "2026-08-10",
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Month" })).toHaveAttribute(
      "href",
      "/dashboard/leaderboard?metric=study-time&period=month&anchor=2026-08-01",
    );
    expect(screen.getByRole("button", { name: "Next period" })).toBeDisabled();
    expect(screen.getByText("This week")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LeaderboardMetricTabs } from "./LeaderboardMetricTabs";

describe("LeaderboardMetricTabs", () => {
  it("keeps the selected range on the Study time URL and makes Experience range-free", () => {
    render(
      <LocaleProvider>
        <LeaderboardMetricTabs
          location={{
            metric: "study-time",
            period: "week",
            anchor: "2026-08-10",
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Study time" })).toHaveAttribute(
      "href",
      "/dashboard/leaderboard?metric=study-time&period=week&anchor=2026-08-10",
    );
    expect(screen.getByRole("tab", { name: "Experience · V2" })).toHaveAttribute(
      "href",
      "/dashboard/leaderboard?metric=experience",
    );
  });

  it("marks Experience active when its route is selected", () => {
    render(
      <LocaleProvider>
        <LeaderboardMetricTabs
          location={{ metric: "experience", period: "all", anchor: null }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Experience · V2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { CurrentLeaderboardPeriodLabel } from "./CurrentLeaderboardPeriodLabel";

describe("CurrentLeaderboardPeriodLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("shows a compact current label and keeps its exact range in a non-animated tooltip", () => {
    render(
      <LocaleProvider>
        <CurrentLeaderboardPeriodLabel
          location={{
            metric: "study-time",
            period: "week",
            anchor: "2026-08-10",
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByLabelText("This week: Aug 10 – Aug 16")).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByText("Aug 10 – Aug 16")).toHaveClass("hidden");
  });

  it("shows the exact date range directly for historical periods", () => {
    render(
      <LocaleProvider>
        <CurrentLeaderboardPeriodLabel
          location={{
            metric: "study-time",
            period: "week",
            anchor: "2026-08-03",
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.queryByText("This week")).not.toBeInTheDocument();
    expect(screen.getByText("Aug 3 – Aug 9")).not.toHaveClass("hidden");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OxfordProgressSummary } from "@/entities/collection";
import { LocaleProvider } from "@/shared/lib/providers";
import { ReviewProgressLevels } from "./ReviewProgressLevels";

function makeProgress(
  partial: Partial<OxfordProgressSummary> = {},
): OxfordProgressSummary {
  return {
    total: 100,
    masteredCount: 20,
    learningCount: 50,
    newCount: 30,
    levelCounts: [
      { level: 1, count: 10 },
      { level: 2, count: 10 },
      { level: 3, count: 10 },
      { level: 4, count: 10 },
      { level: 5, count: 5 },
      { level: 6, count: 5 },
      { level: 7, count: 20 },
    ],
    ...partial,
  };
}

describe("ReviewProgressLevels", () => {
  it("renders levels 0–7 with counts and percentages", () => {
    render(
      <LocaleProvider>
        <ReviewProgressLevels progress={makeProgress()} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Level 0")).toBeInTheDocument();
    expect(screen.getByText("Level 7")).toBeInTheDocument();
    expect(screen.getByText("(30/100)")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("(20/100)")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("shows 0% when total is zero", () => {
    render(
      <LocaleProvider>
        <ReviewProgressLevels
          progress={makeProgress({
            total: 0,
            newCount: 0,
            levelCounts: Array.from({ length: 7 }, (_, index) => ({
              level: index + 1,
              count: 0,
            })),
          })}
        />
      </LocaleProvider>,
    );

    expect(screen.getAllByText("0%").length).toBe(8);
  });

  it("falls back when progress is null", () => {
    render(
      <LocaleProvider>
        <ReviewProgressLevels progress={null} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Level 0")).toBeInTheDocument();
    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getAllByText("(0/0)").length).toBe(8);
  });
});

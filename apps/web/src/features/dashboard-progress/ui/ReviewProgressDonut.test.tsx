import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OxfordProgressSummary } from "@/entities/collection";
import { LocaleProvider } from "@/shared/lib/providers";
import { ReviewProgressDonut } from "./ReviewProgressDonut";

function makeProgress(
  partial: Partial<OxfordProgressSummary>,
): OxfordProgressSummary {
  return {
    total: 0,
    masteredCount: 0,
    learningCount: 0,
    newCount: 0,
    levelCounts: Array.from({ length: 7 }, (_, index) => ({
      level: index + 1,
      count: 0,
    })),
    ...partial,
  };
}

function renderDonut(progress: OxfordProgressSummary | null) {
  return render(
    <LocaleProvider>
      <ReviewProgressDonut progress={progress} />
    </LocaleProvider>,
  );
}

describe("ReviewProgressDonut", () => {
  it("renders total and legend values", () => {
    renderDonut(
      makeProgress({
        total: 20,
        masteredCount: 8,
        learningCount: 7,
        newCount: 5,
      }),
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByLabelText("20 entries")).toBeInTheDocument();
    expect(screen.getByText("Mastered")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders a full-ring stroke without radial side borders when one part", () => {
    const { container } = renderDonut(
      makeProgress({
        total: 10,
        masteredCount: 10,
        learningCount: 0,
        newCount: 0,
      }),
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // Full ring uses two closed multi-arc paths (outer + inner)
    const paths = svg?.querySelectorAll("path") ?? [];
    expect(paths.length).toBeGreaterThanOrEqual(2);
    // No side-border rects for a single segment
    expect(svg?.querySelectorAll("rect").length ?? 0).toBe(0);
  });

  it("renders side borders and dividers for multiple parts", () => {
    const { container } = renderDonut(
      makeProgress({
        total: 30,
        masteredCount: 10,
        learningCount: 10,
        newCount: 10,
      }),
    );

    const svg = container.querySelector("svg");
    expect(svg?.querySelectorAll("rect").length ?? 0).toBeGreaterThan(0);
    expect(svg?.querySelectorAll("line").length ?? 0).toBeGreaterThan(0);
  });

  it("handles null progress as zeros", () => {
    renderDonut(null);

    expect(screen.getByLabelText("0 entries")).toBeInTheDocument();
    expect(screen.getByText("Mastered").parentElement).toHaveTextContent("0");
  });
});

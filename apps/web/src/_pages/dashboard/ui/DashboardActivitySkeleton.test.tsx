import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardActivitySkeleton } from "./DashboardActivitySkeleton";

describe("DashboardActivitySkeleton", () => {
  it("renders a decorative loading placeholder for activity metrics", () => {
    const { container } = render(<DashboardActivitySkeleton />);

    expect(container.firstChild).toHaveAttribute("aria-hidden");
    expect(
      container.querySelectorAll(".animate-pulse, [class*='Skeleton']").length,
    ).toBeGreaterThan(0);
    expect(container.querySelectorAll(".rounded-2xl.border").length).toBeGreaterThanOrEqual(
      6,
    );
  });
});

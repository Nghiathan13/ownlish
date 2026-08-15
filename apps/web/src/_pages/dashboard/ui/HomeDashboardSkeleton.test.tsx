import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboardSkeleton } from "./HomeDashboardSkeleton";

describe("HomeDashboardSkeleton", () => {
  it("renders a decorative loading placeholder", () => {
    const { container } = render(<HomeDashboardSkeleton />);

    expect(container.firstChild).toHaveAttribute("aria-hidden");
    expect(container.querySelectorAll(".animate-pulse, [class*='Skeleton']").length).toBeGreaterThan(0);
    // Metric cards + level bars skeleton rows are present
    expect(container.querySelectorAll(".rounded-2xl.border").length).toBeGreaterThanOrEqual(6);
  });
});

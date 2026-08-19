import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardProgressSkeleton } from "./DashboardProgressSkeleton";

describe("DashboardProgressSkeleton", () => {
  it("renders a decorative loading placeholder for progress cards", () => {
    const { container } = render(<DashboardProgressSkeleton />);

    expect(container.firstChild).toHaveAttribute("aria-hidden");
    expect(container.querySelectorAll(".rounded-2xl.border").length).toBe(2);
  });
});

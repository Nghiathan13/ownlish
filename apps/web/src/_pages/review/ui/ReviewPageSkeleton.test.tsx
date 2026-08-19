import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewPageSkeleton } from "./ReviewPageSkeleton";

describe("ReviewPageSkeleton", () => {
  it("renders a decorative loading placeholder for the review workspace", () => {
    const { container } = render(<ReviewPageSkeleton />);

    expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThan(0);
    expect(
      container.querySelectorAll(".animate-pulse, [class*='Skeleton']").length,
    ).toBeGreaterThan(0);
  });
});

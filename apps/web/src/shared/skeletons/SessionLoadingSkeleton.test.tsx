import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionLoadingSkeleton } from "./SessionLoadingSkeleton";

describe("SessionLoadingSkeleton", () => {
  it("renders its three placeholder lines in normal and centered layouts", () => {
    const { container, rerender } = render(<SessionLoadingSkeleton />);
    expect(container.querySelectorAll("[class*='animate-pulse']")).toHaveLength(3);

    rerender(<SessionLoadingSkeleton centered />);
    expect(container.querySelectorAll("[class*='animate-pulse']")).toHaveLength(3);
  });
});

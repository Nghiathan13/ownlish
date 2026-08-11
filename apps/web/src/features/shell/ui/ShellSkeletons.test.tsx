import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShellAuthSlotSkeleton } from "./ShellAuthSlotSkeleton";
import { ShellNavSkeleton } from "./ShellNavSkeleton";

describe("shell skeletons", () => {
  it("renders sidebar and mobile auth placeholders", () => {
    const { container, rerender } = render(<ShellAuthSlotSkeleton />);
    expect(container.querySelectorAll("[class*='animate-pulse']")).toHaveLength(2);

    rerender(<ShellAuthSlotSkeleton collapsed />);
    expect(container.querySelectorAll("[class*='animate-pulse']")).toHaveLength(1);

    rerender(<ShellAuthSlotSkeleton variant="mobile" />);
    expect(container.querySelectorAll("[class*='animate-pulse']")).toHaveLength(2);
  });

  it("renders navigation placeholders for both layouts", () => {
    const { container, rerender } = render(<ShellNavSkeleton />);
    expect(container.querySelectorAll("[class*='animate-pulse']").length).toBeGreaterThan(0);

    rerender(<ShellNavSkeleton collapsed variant="mobile" />);
    expect(container.querySelectorAll("[class*='animate-pulse']").length).toBeGreaterThan(0);
  });
});

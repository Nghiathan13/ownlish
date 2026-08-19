import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockTestsTabSkeleton } from "./MockTestsTabSkeleton";

describe("MockTestsTabSkeleton", () => {
  it("renders four loading placeholders", () => {
    const { container } = render(<MockTestsTabSkeleton />);

    expect(container.querySelectorAll("[aria-hidden]")).toHaveLength(4);
  });
});

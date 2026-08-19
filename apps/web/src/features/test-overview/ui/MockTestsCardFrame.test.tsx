import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockTestsCardFrame } from "./MockTestsCardFrame";

describe("MockTestsCardFrame", () => {
  it("renders children inside the shared card frame", () => {
    const { container } = render(
      <MockTestsCardFrame>
        <p>Mock cards</p>
      </MockTestsCardFrame>,
    );

    expect(container.firstElementChild).toHaveClass("grid", "gap-4");
    expect(screen.getByText("Mock cards")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardFrame } from "./CardFrame";

describe("CardFrame", () => {
  it("renders a borderless auto-fit card frame", () => {
    const { container } = render(
      <CardFrame>
        <p>Card content</p>
      </CardFrame>,
    );

    expect(container.firstElementChild).toHaveClass("grid", "gap-4");
    expect(container.firstElementChild).not.toHaveClass(
      "rounded-card",
      "border-border",
      "bg-surface-card",
    );
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });
});

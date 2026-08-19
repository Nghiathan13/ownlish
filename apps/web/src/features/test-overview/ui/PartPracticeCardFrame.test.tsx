import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PartPracticeCardFrame } from "./PartPracticeCardFrame";

describe("PartPracticeCardFrame", () => {
  it("renders children inside the shared card frame", () => {
    const { container } = render(
      <PartPracticeCardFrame>
        <p>Part card</p>
      </PartPracticeCardFrame>,
    );

    expect(container.firstElementChild).toHaveClass("grid", "gap-4");
    expect(screen.getByText("Part card")).toBeInTheDocument();
  });
});

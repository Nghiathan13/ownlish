import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OxfordWordGroupGrid } from "./OxfordWordGroupGrid";

describe("OxfordWordGroupGrid", () => {
  it("renders 48 A1 groups and preserves the final 17-word range", () => {
    render(
      <OxfordWordGroupGrid band="A1" itemCount={957} onOpenPart={() => {}} />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(48);
    expect(screen.getAllByRole("button", { name: "Review" })).toHaveLength(48);
    expect(screen.getByRole("heading", { name: "A1 - Part 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open A1 - Part 1" })).toHaveAttribute(
      "href",
      "/collections/oxford/A1/part-1",
    );
    expect(screen.getByRole("heading", { name: "A1 - Part 48" }))
      .toHaveTextContent("A1 - Part 48");
    expect(screen.getByText("17 words")).toBeInTheDocument();
  });

  it("opens a part locally for a plain primary click", () => {
    const onOpenPart = vi.fn();

    render(
      <OxfordWordGroupGrid
        band="A1"
        itemCount={20}
        onOpenPart={onOpenPart}
      />,
    );

    const partLink = screen.getByRole("link", { name: "Open A1 - Part 1" });

    fireEvent.click(partLink);

    expect(onOpenPart).toHaveBeenCalledTimes(1);
    expect(onOpenPart).toHaveBeenCalledWith(1);
  });
});

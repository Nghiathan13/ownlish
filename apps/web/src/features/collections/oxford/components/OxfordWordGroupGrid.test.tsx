import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { OxfordWordGroupGrid } from "./OxfordWordGroupGrid";

describe("OxfordWordGroupGrid", () => {
  it("renders 48 A1 groups and preserves the final 17-word range", () => {
    render(
      <LocaleProvider>
        <OxfordWordGroupGrid band="A1" itemCount={957} onOpenPart={() => {}} />
      </LocaleProvider>,
    );

    expect(screen.getAllByRole("link")).toHaveLength(96);
    expect(screen.getAllByRole("link", { name: "Review" })).toHaveLength(48);
    expect(screen.getAllByRole("link", { name: "Review" })[0]).toHaveAttribute(
      "href",
      "/review/oxford/A1/part-1",
    );
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
      <LocaleProvider>
        <OxfordWordGroupGrid
          band="A1"
          itemCount={20}
          onOpenPart={onOpenPart}
        />
      </LocaleProvider>,
    );

    const partLink = screen.getByRole("link", { name: "Open A1 - Part 1" });

    fireEvent.click(partLink);

    expect(onOpenPart).toHaveBeenCalledTimes(1);
    expect(onOpenPart).toHaveBeenCalledWith(1);
  });
});

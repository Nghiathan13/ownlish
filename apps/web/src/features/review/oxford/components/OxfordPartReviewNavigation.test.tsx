import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OxfordPartReviewNavigation } from "./OxfordPartReviewNavigation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("OxfordPartReviewNavigation", () => {
  it("lists the active band's parts", () => {
    render(
      <OxfordPartReviewNavigation activeBand="A2" activePart={2} itemCount={41} />,
    );

    expect(screen.queryByRole("link", { name: "A1" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Part/ })).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Part 2" })).toHaveAttribute(
      "href",
      "/review/oxford/A2/part-2",
    );
  });

  it("uses the provided navigation handler for a part", () => {
    const onSelectPart = vi.fn();

    render(
      <OxfordPartReviewNavigation
        activeBand="A1"
        activePart={1}
        itemCount={40}
        onSelectPart={onSelectPart}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Part 2" }));

    expect(onSelectPart).toHaveBeenCalledWith(2);
  });

  it("returns to the first part when the band changes", () => {
    const { rerender } = render(
      <OxfordPartReviewNavigation activeBand="A1" activePart={1} itemCount={100} />,
    );
    const partsList = screen
      .getByRole("navigation", { name: "Oxford review parts" })
      .querySelector(".overlay-scroll-hide");

    if (!partsList) {
      throw new Error("Oxford parts list is missing");
    }

    partsList.scrollTop = 96;

    rerender(
      <OxfordPartReviewNavigation activeBand="A2" activePart={1} itemCount={100} />,
    );

    expect(partsList.scrollTop).toBe(0);
  });

  it("centers the active part when there is enough scroll space", () => {
    const { rerender } = render(
      <OxfordPartReviewNavigation activeBand="A1" activePart={1} itemCount={200} />,
    );
    const partsList = screen
      .getByRole("navigation", { name: "Oxford review parts" })
      .querySelector(".overlay-scroll-hide");
    const partSix = screen.getByRole("link", { name: "Part 6" });

    if (!partsList) {
      throw new Error("Oxford parts list is missing");
    }

    Object.defineProperties(partsList, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 640 },
    });
    Object.defineProperties(partSix, {
      offsetHeight: { configurable: true, value: 32 },
      offsetTop: { configurable: true, value: 300 },
    });

    rerender(
      <OxfordPartReviewNavigation activeBand="A1" activePart={6} itemCount={200} />,
    );

    expect(partsList.scrollTop).toBe(256);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ALL_TOEIC_PART_NUMBERS } from "@/entities/toeic-runtime";
import { LocaleProvider } from "@/shared/lib/providers";
import { PartPracticeTabs } from "./PartPracticeTabs";

describe("PartPracticeTabs", () => {
  it("renders every part tab and marks the selected part", () => {
    render(
      <LocaleProvider>
        <PartPracticeTabs selectedPartNumber={3} />
      </LocaleProvider>,
    );

    expect(screen.getAllByRole("tab")).toHaveLength(ALL_TOEIC_PART_NUMBERS.length);
    expect(screen.getByRole("tab", { name: "Part 3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Part 7" })).toHaveAttribute(
      "href",
      "/tests/part-practice?part=7",
    );
  });
});

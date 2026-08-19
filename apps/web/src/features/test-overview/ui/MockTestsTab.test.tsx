import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TOEIC_YEARS } from "@/entities/toeic-runtime";
import { MockTestsTab } from "./MockTestsTab";

describe("MockTestsTab", () => {
  it("renders every configured year without waiting for catalog data", () => {
    render(<MockTestsTab selectedYear={2023} />);

    expect(screen.getAllByRole("tab")).toHaveLength(TOEIC_YEARS.length);
    expect(screen.getByRole("tab", { name: "ETS 2023" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "YBM 2025" })).toHaveAttribute(
      "href",
      "/tests/mock-tests?year=2025",
    );
  });
});

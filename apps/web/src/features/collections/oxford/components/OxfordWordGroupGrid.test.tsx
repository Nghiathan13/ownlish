import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { OxfordWordGroupGrid } from "./OxfordWordGroupGrid";

const collection: CollectionSummary = {
  cefrLevel: "A1",
  createdAt: "2026-07-22T00:00:00.000Z",
  description: null,
  id: "oxford-a1",
  isDefault: false,
  isPublic: true,
  itemCount: 957,
  kind: "SYSTEM",
  name: "Oxford A1",
  source: "oxford",
  updatedAt: "2026-07-22T00:00:00.000Z",
};

describe("OxfordWordGroupGrid", () => {
  it("renders 48 A1 groups and preserves the final 17-word range", () => {
    render(<OxfordWordGroupGrid band="A1" collection={collection} />);

    expect(screen.getAllByRole("link")).toHaveLength(48);
    expect(screen.getAllByRole("button", { name: "Review" })).toHaveLength(48);
    expect(screen.getByRole("heading", { name: "A1 - Part 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open A1 - Part 1" })).toHaveAttribute(
      "href",
      "/collections?band=A1&tab=oxford&group=1",
    );
    expect(screen.getByRole("heading", { name: "A1 - Part 48" }))
      .toHaveTextContent("A1 - Part 48");
    expect(screen.getByText("17 words")).toBeInTheDocument();
  });
});

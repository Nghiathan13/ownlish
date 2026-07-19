import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { ImportTargetCollectionSelect } from "./ImportTargetCollectionSelect";

const collections: CollectionSummary[] = [
  {
    id: "collection-1",
    name: "Daily words",
    description: null,
    kind: "USER",
    source: null,
    cefrLevel: null,
    isDefault: true,
    isPublic: false,
    itemCount: 12,
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "collection-2",
    name: "Business English",
    description: null,
    kind: "USER",
    source: null,
    cefrLevel: null,
    isDefault: false,
    isPublic: false,
    itemCount: 8,
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  },
];

describe("ImportTargetCollectionSelect", () => {
  it("selects a review collection from the custom dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ImportTargetCollectionSelect
        ariaLabel="Review collection"
        collections={collections}
        onChange={onChange}
        value="collection-1"
        variant="review"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Review collection: My Vocabulary",
    });

    await user.click(trigger);

    expect(screen.getByRole("listbox", { name: "Review collection" })).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Business English" }));

    expect(onChange).toHaveBeenCalledWith("collection-2");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("uses the same custom dropdown for the vocabulary toolbar", async () => {
    const user = userEvent.setup();

    render(
      <ImportTargetCollectionSelect
        ariaLabel="Collection"
        collections={collections}
        onChange={vi.fn()}
        value="collection-1"
        variant="toolbar"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Collection: My Vocabulary" }),
    );

    expect(screen.getByRole("listbox", { name: "Collection" })).toBeInTheDocument();
  });
});

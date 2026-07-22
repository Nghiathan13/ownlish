import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CollectionsQuickSwitcher } from "./CollectionsQuickSwitcher";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

const collections: CollectionSummary[] = [
  {
    cefrLevel: null,
    createdAt: "2026-07-22T00:00:00.000Z",
    description: null,
    id: "collection-1",
    isDefault: true,
    isPublic: false,
    itemCount: 10,
    kind: "USER",
    name: "Daily words",
    source: null,
    updatedAt: "2026-07-22T00:00:00.000Z",
  },
];

describe("CollectionsQuickSwitcher", () => {
  it("opens the selected collection", async () => {
    const user = userEvent.setup();

    render(<CollectionsQuickSwitcher collections={collections} />);

    await user.click(
      screen.getByRole("button", {
        name: "Open collection: Select collection",
      }),
    );
    await user.click(screen.getByRole("option", { name: "My Vocabulary" }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/collections/collection-1?kind=user",
    );
  });
});

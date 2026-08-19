import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewUserCollectionNavigation } from "./ReviewUserCollectionNavigation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("ReviewUserCollectionNavigation", () => {
  it("links each user collection to its review queue", () => {
    render(
      <ReviewUserCollectionNavigation
        activeCollectionId="default-id"
        collections={[
          {
            id: "default-id",
            name: "Vocabulary",
            description: null,
            kind: "USER",
            source: null,
            cefrLevel: null,
            isDefault: true,
            isPublic: false,
            itemCount: 10,
            createdAt: "2026-07-23T00:00:00.000Z",
            updatedAt: "2026-07-23T00:00:00.000Z",
          },
          {
            id: "work-id",
            name: "Work English",
            description: null,
            kind: "USER",
            source: null,
            cefrLevel: null,
            isDefault: false,
            isPublic: false,
            itemCount: 4,
            createdAt: "2026-07-23T00:00:00.000Z",
            updatedAt: "2026-07-23T00:00:00.000Z",
          },
        ]}
        isLoading={false}
      />,
    );

    expect(screen.getByRole("link", { name: "My Vocabulary" })).toHaveAttribute(
      "href",
      "/review?collectionId=default-id",
    );
    expect(screen.getByRole("link", { name: "My Vocabulary" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Work English" })).toHaveAttribute(
      "href",
      "/review?collectionId=work-id",
    );
  });
});

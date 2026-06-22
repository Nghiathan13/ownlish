import { describe, expect, it } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  filterCollectionsByCategory,
  findCollectionBySlug,
  getCollectionCategory,
  getCollectionSlug,
} from "./collectionDisplay";

function makeCollection(
  overrides: Partial<CollectionSummary> = {},
): CollectionSummary {
  return {
    id: "collection-id",
    name: "Oxford A1",
    description: null,
    kind: "SYSTEM",
    source: "oxford",
    cefrLevel: "A1",
    isPublic: true,
    itemCount: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("collection display helpers", () => {
  it("detects known collection categories", () => {
    expect(getCollectionCategory(makeCollection())).toBe("oxford");
    expect(
      getCollectionCategory(
        makeCollection({ name: "TOEIC Essential", source: "toeic" }),
      ),
    ).toBe("toeic");
    expect(
      getCollectionCategory(
        makeCollection({ name: "IELTS Academic", source: "ielts" }),
      ),
    ).toBe("ielts");
  });

  it("builds a stable source-level slug", () => {
    expect(getCollectionSlug(makeCollection())).toBe("oxford-a1");
  });

  it("finds a collection by slug or id fallback", () => {
    const collections = [makeCollection()];

    expect(findCollectionBySlug(collections, "oxford-a1")?.id).toBe(
      "collection-id",
    );
    expect(findCollectionBySlug(collections, "collection-id")?.id).toBe(
      "collection-id",
    );
  });

  it("filters user collections for the my tab only", () => {
    const userCollection = makeCollection({
      id: "user-collection",
      kind: "USER",
      name: "Oxford Notes",
      source: null,
      cefrLevel: null,
      isPublic: false,
    });
    const systemCollection = makeCollection();
    const collections = [userCollection, systemCollection];

    expect(filterCollectionsByCategory(collections, "my")).toEqual([
      userCollection,
    ]);
    expect(filterCollectionsByCategory(collections, "oxford")).toEqual([
      systemCollection,
    ]);
    expect(filterCollectionsByCategory(collections, "oxford")).not.toContain(
      userCollection,
    );
  });
});

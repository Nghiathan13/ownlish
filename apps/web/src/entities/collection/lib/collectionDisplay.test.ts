import { describe, expect, it } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  filterCollectionsByCategory,
  findCollectionBySlug,
  getCollectionCategory,
  getCollectionSlug,
  getUserOwnedCollections,
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
    isDefault: false,
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

  it("filters user collections for the user tab only", () => {
    const userCollection = makeCollection({
      id: "user-collection",
      kind: "USER",
      name: "Oxford Notes",
      source: null,
      cefrLevel: null,
      isDefault: false,
      isPublic: false,
    });
    const defaultCollection = makeCollection({
      id: "default-collection",
      kind: "USER",
      name: "My Vocabulary",
      source: null,
      cefrLevel: null,
      isDefault: true,
      isPublic: false,
    });
    const systemCollection = makeCollection();
    const collections = [defaultCollection, userCollection, systemCollection];

    expect(filterCollectionsByCategory(collections, "user")).toEqual([
      userCollection,
    ]);
    expect(filterCollectionsByCategory(collections, "oxford")).toEqual([
      systemCollection,
    ]);
    expect(filterCollectionsByCategory(collections, "oxford")).not.toContain(
      userCollection,
    );
  });

  it("lists all user-owned collections with default first", () => {
    const defaultCollection = makeCollection({
      id: "default-collection",
      kind: "USER",
      name: "My Vocabulary",
      source: null,
      cefrLevel: null,
      isDefault: true,
      isPublic: false,
    });
    const studyCollection = makeCollection({
      id: "study-collection",
      kind: "USER",
      name: "Study List",
      source: null,
      cefrLevel: null,
      isDefault: false,
      isPublic: false,
    });

    expect(
      getUserOwnedCollections([studyCollection, defaultCollection]),
    ).toEqual([defaultCollection, studyCollection]);
  });
});

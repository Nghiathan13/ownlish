import { describe, expect, it } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  filterCollectionsByCategory,
  findCollectionById,
  getCollectionCategory,
  getCollectionPath,
  getCollectionsLegacyRedirectPath,
  getCollectionsListCategory,
  getCollectionsListPath,
  getUserOwnedCollections,
  parseCollectionCategoryTab,
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
  it("detects oxford collection category", () => {
    expect(getCollectionCategory(makeCollection())).toBe("oxford");
    expect(
      getCollectionCategory(
        makeCollection({ name: "TOEIC Essential", source: "toeic" }),
      ),
    ).toBeNull();
  });

  it("builds a user collection path from id", () => {
    expect(
      getCollectionPath(makeCollection({ kind: "USER", isDefault: true })),
    ).toBe("/collections/user/collection-id");
  });

  it("builds collections list paths from category", () => {
    expect(getCollectionsListPath("user")).toBe("/collections/user");
    expect(getCollectionsListPath("oxford")).toBe("/collections/oxford/A1");
    expect(parseCollectionCategoryTab("oxford")).toBe("oxford");
    expect(parseCollectionCategoryTab("toeic")).toBeNull();
    expect(parseCollectionCategoryTab("invalid")).toBeNull();
  });

  it("maps legacy query collections URLs to path URLs", () => {
    expect(
      getCollectionsLegacyRedirectPath(
        new URLSearchParams("tab=oxford&band=B1&group=2"),
      ),
    ).toBe("/collections/oxford/B1/part-2");
    expect(
      getCollectionsLegacyRedirectPath(new URLSearchParams("tab=oxford")),
    ).toBe("/collections/oxford/A1");
    expect(
      getCollectionsLegacyRedirectPath(new URLSearchParams("tab=toeic")),
    ).toBe("/collections/user");
    expect(
      getCollectionsLegacyRedirectPath(new URLSearchParams("tab=ielts")),
    ).toBe("/collections/user");
    expect(getCollectionsLegacyRedirectPath(new URLSearchParams())).toBeNull();
  });

  it("resolves collections list category from collection kind", () => {
    expect(
      getCollectionsListCategory(
        makeCollection({ kind: "USER", isDefault: true }),
      ),
    ).toBe("user");
    expect(getCollectionsListCategory(makeCollection())).toBe("oxford");
  });

  it("finds a collection by id", () => {
    const collections = [makeCollection()];

    expect(findCollectionById(collections, "collection-id")?.id).toBe(
      "collection-id",
    );
    expect(findCollectionById(collections, "missing-id")).toBeNull();
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

  it("keeps duplicate-named user collections distinct by id", () => {
    const firstStudyList = makeCollection({
      id: "study-list-1",
      kind: "USER",
      name: "Study List",
      source: null,
      cefrLevel: null,
      isDefault: false,
      isPublic: false,
    });
    const secondStudyList = makeCollection({
      id: "study-list-2",
      kind: "USER",
      name: "Study List",
      source: null,
      cefrLevel: null,
      isDefault: false,
      isPublic: false,
    });

    expect(getCollectionPath(firstStudyList)).toBe(
      "/collections/user/study-list-1",
    );
    expect(getCollectionPath(secondStudyList)).toBe(
      "/collections/user/study-list-2",
    );
    expect(findCollectionById([firstStudyList, secondStudyList], "study-list-2"))
      .toBe(secondStudyList);
  });
});

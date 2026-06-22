import { describe, expect, it } from "vitest";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  filterCollectionsByCategory,
  findCollectionById,
  getCollectionCategory,
  getCollectionPath,
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

  it("builds a collection path from id", () => {
    expect(getCollectionPath(makeCollection())).toBe("/collections/collection-id");
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

    expect(getCollectionPath(firstStudyList)).toBe("/collections/study-list-1");
    expect(getCollectionPath(secondStudyList)).toBe("/collections/study-list-2");
    expect(findCollectionById([firstStudyList, secondStudyList], "study-list-2"))
      .toBe(secondStudyList);
  });
});

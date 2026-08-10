import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.hoisted(() => vi.fn());
const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));

vi.mock("@/shared/api/http", () => ({ apiRequest, invalidApiResponse }));

import {
  createCollection,
  getCollectionCatalogWords,
  getOxfordProgressSummary,
  importCollection,
  importOxfordPart,
  listCollections,
} from "./collections";

const collection = {
  id: "collection-1",
  name: "Vocabulary",
  description: null,
  kind: "USER",
  source: null,
  cefrLevel: null,
  isDefault: true,
  isPublic: false,
  itemCount: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const catalogWord = {
  id: "word-1",
  word: "learn",
  normalizedWord: "learn",
  definitions: [{
    id: "definition-1",
    type: "verb",
    meaningVi: null,
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: "A1",
    source: "oxford_3000",
  }],
};

describe("collections API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("parses a collection list and sends the bearer token", async () => {
    apiRequest.mockResolvedValue([collection]);

    await expect(listCollections("token")).resolves.toEqual([collection]);
    expect(apiRequest).toHaveBeenCalledWith("/collections", { signal: undefined, token: "token" });
  });

  it("builds a paginated catalog request and parses its words", async () => {
    apiRequest.mockResolvedValue({ items: [catalogWord], total: 1, offset: 10, limit: 20 });

    await expect(getCollectionCatalogWords("token", "collection-1", { offset: 10, limit: 20 })).resolves.toEqual({
      items: [catalogWord], total: 1, offset: 10, limit: 20,
    });
    expect(apiRequest).toHaveBeenCalledWith("/collections/collection-1/catalog-words?limit=20&offset=10", {
      signal: undefined, token: "token",
    });
  });

  it("uses no query string for all Oxford progress and parses level counts", async () => {
    apiRequest.mockResolvedValue({
      total: 2, masteredCount: 1, learningCount: 1, newCount: 0,
      levelCounts: [{ level: 7, count: 1 }],
    });

    await expect(getOxfordProgressSummary("token")).resolves.toEqual({
      total: 2, masteredCount: 1, learningCount: 1, newCount: 0,
      levelCounts: [{ level: 7, count: 1 }],
    });
    expect(apiRequest).toHaveBeenCalledWith("/collections/oxford/progress", { signal: undefined, token: "token" });
  });

  it("includes optional import targets only when provided", async () => {
    apiRequest.mockResolvedValue({ imported: 1, skipped: 0 });

    await expect(importOxfordPart("token", "A1", 1, ["definition-1"], { targetCollectionId: "collection-1" })).resolves.toEqual({
      imported: 1, updated: 0, skipped: 0,
    });
    expect(apiRequest).toHaveBeenLastCalledWith("/collections/oxford/A1/parts/1/import", {
      method: "POST", token: "token", body: JSON.stringify({ catalogDefinitionIds: ["definition-1"], targetCollectionId: "collection-1" }),
    });
  });

  it("creates a collection and passes arbitrary import input through", async () => {
    apiRequest.mockResolvedValueOnce(collection).mockResolvedValueOnce({ imported: 2, updated: 1, skipped: 0 });

    await expect(createCollection("token", { name: "Vocabulary" })).resolves.toEqual(collection);
    await expect(importCollection("token", "collection-1", { limit: 10 })).resolves.toEqual({ imported: 2, updated: 1, skipped: 0 });
    expect(apiRequest).toHaveBeenLastCalledWith("/collections/collection-1/import", {
      method: "POST", token: "token", body: JSON.stringify({ limit: 10 }),
    });
  });

  it("rejects malformed server data", async () => {
    apiRequest.mockResolvedValue([{ ...collection, kind: "UNKNOWN" }]);
    await expect(listCollections("token")).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });
});

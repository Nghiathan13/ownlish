import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.hoisted(() => vi.fn());
const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));

vi.mock("@/shared/api/http", () => ({ apiRequest, invalidApiResponse }));

import {
  createVocabWord,
  deleteVocabEntry,
  getVocabStats,
  listDueReviewWords,
  listVocabWords,
  updateVocabReview,
} from "./vocab";

const entry = {
  id: "entry-1", userId: "user-1", collectionId: "collection-1", systemEntryId: null,
  word: "learn", normalizedWord: "learn", type: null, meaningVi: null, definition: null,
  example: null, exampleVi: null, ipaUk: null, ipaUs: null, band: null, source: "manual",
  level: 0, wrongCount: 0, lastReview: null, nextReview: null,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("vocabulary API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("builds a vocabulary query from pagination and search parameters", async () => {
    apiRequest.mockResolvedValue({ items: [entry], meta: { limit: 20, offset: 0, total: 1, hasMore: false } });

    await expect(listVocabWords("token", { collectionId: "collection-1", limit: 20, offset: 0, search: "learn" })).resolves.toMatchObject({
      items: [{ id: "entry-1", definitions: [entry] }],
      meta: { total: 1, hasMore: false },
    });
    expect(apiRequest).toHaveBeenCalledWith("/vocab?collectionId=collection-1&limit=20&offset=0&search=learn", {
      signal: undefined, token: "token",
    });
  });

  it("handles empty vocabulary and review queues", async () => {
    apiRequest
      .mockResolvedValueOnce({ items: [], meta: { limit: 20, offset: 0, total: 0, hasMore: false } })
      .mockResolvedValueOnce({ items: [], meta: { limit: 10, offset: 0, total: 0, hasMore: false } });

    await expect(listVocabWords("token", { collectionId: "collection-1" })).resolves.toMatchObject({ items: [] });
    await expect(listDueReviewWords("token", { collectionId: "collection-1", limit: 10 })).resolves.toMatchObject({ items: [] });
    expect(apiRequest).toHaveBeenLastCalledWith("/vocab/review/due?collectionId=collection-1&limit=10", {
      signal: undefined, token: "token",
    });
  });

  it("requests stats with and without an optional collection", async () => {
    apiRequest.mockResolvedValue({ total: 2, due: 1, mastered: 1, highWrongCount: 0, levels: [{ level: 0, count: 1 }] });

    await expect(getVocabStats("token")).resolves.toMatchObject({ total: 2 });
    await expect(getVocabStats("token", { collectionId: "collection-1" })).resolves.toMatchObject({ mastered: 1 });
    expect(apiRequest).toHaveBeenLastCalledWith("/vocab/stats?collectionId=collection-1", {
      signal: undefined, token: "token",
    });
  });

  it("sends mutation bodies and parses deletion results", async () => {
    apiRequest.mockResolvedValueOnce(entry).mockResolvedValueOnce(entry).mockResolvedValueOnce({ deletedEntryId: "entry-1" });

    await expect(createVocabWord("token", { collectionId: "collection-1", word: "learn" })).resolves.toMatchObject({ definitions: [entry] });
    await expect(updateVocabReview("token", "entry-1", {
      rating: "GOOD",
      submissionId: "11111111-1111-4111-8111-111111111111",
    })).resolves.toEqual(entry);
    await expect(deleteVocabEntry("token", "entry-1")).resolves.toEqual({ deletedEntryId: "entry-1" });
    expect(apiRequest).toHaveBeenLastCalledWith("/vocab/entry-1", { method: "DELETE", token: "token" });
  });

  it("rejects malformed list metadata", async () => {
    apiRequest.mockResolvedValue({ items: [], meta: { limit: "20", offset: 0, total: 0, hasMore: false } });
    await expect(listVocabWords("token", { collectionId: "collection-1" })).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });
});

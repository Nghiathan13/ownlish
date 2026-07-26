import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type {
  VocabReviewItem,
  VocabReviewListResponse,
} from "@/entities/vocab/api/vocab";
import {
  getReviewQueueQueryKey,
  getReviewQueueUserQueryKey,
  optimisticallyRemoveFromReviewQueue,
  restoreReviewQueue,
} from "./reviewQueueCache";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function makeItem(id: string): VocabReviewItem {
  return {
    id,
    vocabWordId: `word-${id}`,
    systemEntryId: null,
    sourceWordId: null,
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: null,
    source: "manual",
    level: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    vocabWord: {
      id: `word-${id}`,
      userId: "user-id",
      word: id,
      normalizedWord: id,
    },
  };
}

function makeQueue(items: VocabReviewItem[]): VocabReviewListResponse {
  return {
    items,
    meta: {
      limit: 1000,
      offset: 0,
      total: items.length,
      hasMore: false,
    },
  };
}

describe("getReviewQueueQueryKey", () => {
  it("builds a stable user and collection scoped query key", () => {
    expect(getReviewQueueQueryKey("user-id", "collection-id")).toEqual([
      "review-queue",
      { userId: "user-id", collectionId: "collection-id" },
    ]);
  });

  it("builds a user scoped prefix query key", () => {
    expect(getReviewQueueUserQueryKey("user-id")).toEqual([
      "review-queue",
      { userId: "user-id" },
    ]);
  });
});

describe("optimisticallyRemoveFromReviewQueue", () => {
  it("removes a definition and decrements total by default", async () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id", "collection-id");
    const queue = makeQueue([makeItem("one"), makeItem("two")]);
    queryClient.setQueryData(queryKey, queue);

    const previousQueue = await optimisticallyRemoveFromReviewQueue(
      queryClient,
      "user-id",
      "collection-id",
      "one",
    );

    expect(previousQueue).toEqual(queue);
    expect(queryClient.getQueryData<VocabReviewListResponse>(queryKey)).toEqual({
      ...queue,
      items: [makeItem("two")],
      meta: {
        ...queue.meta,
        total: 1,
      },
    });
  });

  it("can remove a definition without decrementing total", async () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id", "collection-id");
    const queue = makeQueue([makeItem("one"), makeItem("two")]);
    queryClient.setQueryData(queryKey, queue);

    await optimisticallyRemoveFromReviewQueue(
      queryClient,
      "user-id",
      "collection-id",
      "one",
      {
      decrementTotal: false,
    });

    expect(queryClient.getQueryData<VocabReviewListResponse>(queryKey)).toEqual({
      ...queue,
      items: [makeItem("two")],
      meta: queue.meta,
    });
  });

  it("leaves queue unchanged when definition is not in queue", async () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id", "collection-id");
    const queue = makeQueue([makeItem("one")]);
    queryClient.setQueryData(queryKey, queue);

    const previousQueue = await optimisticallyRemoveFromReviewQueue(
      queryClient,
      "user-id",
      "collection-id",
      "missing",
    );

    expect(previousQueue).toEqual(queue);
    expect(queryClient.getQueryData(queryKey)).toBe(queue);
  });

  it("returns undefined when there is no cached queue", async () => {
    const queryClient = createQueryClient();

    await expect(
      optimisticallyRemoveFromReviewQueue(
        queryClient,
        "user-id",
        "collection-id",
        "one",
      ),
    ).resolves.toBeUndefined();
  });
});

describe("restoreReviewQueue", () => {
  it("restores a previous queue", () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id", "collection-id");
    const queue = makeQueue([makeItem("one")]);

    restoreReviewQueue(queryClient, "user-id", "collection-id", queue);

    expect(queryClient.getQueryData(queryKey)).toEqual(queue);
  });

  it("does nothing when previous queue is undefined", () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id", "collection-id");
    const queue = makeQueue([makeItem("one")]);
    queryClient.setQueryData(queryKey, queue);

    restoreReviewQueue(queryClient, "user-id", "collection-id", undefined);

    expect(queryClient.getQueryData(queryKey)).toEqual(queue);
  });
});

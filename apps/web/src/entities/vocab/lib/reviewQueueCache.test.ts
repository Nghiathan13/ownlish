import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type {
  VocabWord,
  VocabWordListResponse,
} from "@/entities/vocab/api/vocab";
import {
  getReviewQueueQueryKey,
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

function makeWord(id: string): VocabWord {
  return {
    id,
    userId: "user-id",
    word: id,
    normalizedWord: id,
    ipa: null,
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    band: null,
    level: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  };
}

function makeQueue(items: VocabWord[]): VocabWordListResponse {
  return {
    items,
    meta: {
      limit: 500,
      offset: 0,
      total: items.length,
      hasMore: false,
    },
  };
}

describe("getReviewQueueQueryKey", () => {
  it("builds a stable user scoped query key", () => {
    expect(getReviewQueueQueryKey("user-id")).toEqual([
      "review-queue",
      { userId: "user-id" },
    ]);
  });
});

describe("optimisticallyRemoveFromReviewQueue", () => {
  it("removes a word and decrements total by default", async () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id");
    const queue = makeQueue([makeWord("one"), makeWord("two")]);
    queryClient.setQueryData(queryKey, queue);

    const previousQueue = await optimisticallyRemoveFromReviewQueue(
      queryClient,
      "user-id",
      "one",
    );

    expect(previousQueue).toEqual(queue);
    expect(queryClient.getQueryData<VocabWordListResponse>(queryKey)).toEqual({
      ...queue,
      items: [makeWord("two")],
      meta: {
        ...queue.meta,
        total: 1,
      },
    });
  });

  it("can remove a word without decrementing total", async () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id");
    const queue = makeQueue([makeWord("one"), makeWord("two")]);
    queryClient.setQueryData(queryKey, queue);

    await optimisticallyRemoveFromReviewQueue(queryClient, "user-id", "one", {
      decrementTotal: false,
    });

    expect(queryClient.getQueryData<VocabWordListResponse>(queryKey)).toEqual({
      ...queue,
      items: [makeWord("two")],
      meta: queue.meta,
    });
  });

  it("leaves queue unchanged when word is not in queue", async () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id");
    const queue = makeQueue([makeWord("one")]);
    queryClient.setQueryData(queryKey, queue);

    const previousQueue = await optimisticallyRemoveFromReviewQueue(
      queryClient,
      "user-id",
      "missing",
    );

    expect(previousQueue).toEqual(queue);
    expect(queryClient.getQueryData(queryKey)).toBe(queue);
  });

  it("returns undefined when there is no cached queue", async () => {
    const queryClient = createQueryClient();

    await expect(
      optimisticallyRemoveFromReviewQueue(queryClient, "user-id", "one"),
    ).resolves.toBeUndefined();
  });
});

describe("restoreReviewQueue", () => {
  it("restores a previous queue", () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id");
    const queue = makeQueue([makeWord("one")]);

    restoreReviewQueue(queryClient, "user-id", queue);

    expect(queryClient.getQueryData(queryKey)).toEqual(queue);
  });

  it("does nothing when previous queue is undefined", () => {
    const queryClient = createQueryClient();
    const queryKey = getReviewQueueQueryKey("user-id");
    const queue = makeQueue([makeWord("one")]);
    queryClient.setQueryData(queryKey, queue);

    restoreReviewQueue(queryClient, "user-id", undefined);

    expect(queryClient.getQueryData(queryKey)).toEqual(queue);
  });
});

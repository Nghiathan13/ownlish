import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CollectionSummary } from "@/entities/collection";
import { OXFORD_BANDS } from "@/entities/collection";
import { EMPTY_PROGRESS } from "../lib/reviewProgress";
import { ApiError } from "@/shared/api";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useReviewProgress } from "./useReviewProgress";

const mocks = vi.hoisted(() => ({
  getOxfordProgressSummary: vi.fn(),
  getVocabStats: vi.fn(),
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<unknown> }) =>
      request("token"),
  ),
  useVocabStats: vi.fn(),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: mocks.runAuthenticatedRequest,
}));

vi.mock("@/entities/vocab", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/vocab")>()),
  getVocabStats: mocks.getVocabStats,
  useVocabStats: mocks.useVocabStats,
}));

vi.mock("@/entities/collection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/collection")>()),
  getOxfordProgressSummary: mocks.getOxfordProgressSummary,
}));

function makeCollection(
  partial: Partial<CollectionSummary> & Pick<CollectionSummary, "id" | "name">,
): CollectionSummary {
  return {
    description: null,
    kind: "USER",
    source: null,
    cefrLevel: null,
    isDefault: false,
    isPublic: false,
    itemCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

const vocabStats = {
  total: 12,
  due: 1,
  mastered: 3,
  highWrongCount: 0,
  levels: [
    { level: 0, count: 4 },
    { level: 1, count: 5 },
    { level: 7, count: 3 },
  ],
};

const oxfordSummary = {
  total: 20,
  masteredCount: 5,
  learningCount: 10,
  newCount: 5,
  levelCounts: Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: index === 0 ? 10 : 0,
  })),
};

describe("useReviewProgress", () => {
  beforeEach(() => {
    mocks.getVocabStats.mockReset();
    mocks.getOxfordProgressSummary.mockReset();
    mocks.runAuthenticatedRequest.mockClear();
    mocks.useVocabStats.mockReset();
    mocks.useVocabStats.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      stats: vocabStats,
    });
  });

  it("exposes collection and band filter options", () => {
    const collections = [
      makeCollection({ id: "c2", name: "Zeta", kind: "USER" }),
      makeCollection({ id: "c1", name: "Alpha", kind: "USER", isDefault: true }),
      makeCollection({ id: "sys", name: "Oxford A1", kind: "SYSTEM" }),
    ];
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections,
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.collectionOptions.map((item) => item.id)).toEqual([
      "c1",
      "c2",
    ]);
    expect(result.current.bandOptions.map((item) => item.id)).toEqual([
      ...OXFORD_BANDS,
    ]);
    expect(result.current.activeCollectionIds).toEqual(["c1", "c2"]);
  });

  it("maps collection stats into progress for the all selection", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [makeCollection({ id: "c1", name: "Alpha" })],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.progress).toEqual({
      total: 12,
      masteredCount: 3,
      learningCount: 5,
      newCount: 4,
      levelCounts: [
        { level: 1, count: 5 },
        { level: 2, count: 0 },
        { level: 3, count: 0 },
        { level: 4, count: 0 },
        { level: 5, count: 0 },
        { level: 6, count: 0 },
        { level: 7, count: 3 },
      ],
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("returns empty progress when every collection is deselected", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [makeCollection({ id: "c1", name: "Alpha" })],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.toggleCollection("c1");
    });

    expect(result.current.activeCollectionIds).toEqual([]);
    expect(result.current.progress).toEqual(EMPTY_PROGRESS);
    expect(result.current.isLoading).toBe(false);
  });

  it("merges multi-collection stats when a partial set is selected", async () => {
    mocks.getVocabStats
      .mockResolvedValueOnce({
        total: 4,
        due: 0,
        mastered: 1,
        highWrongCount: 0,
        levels: [{ level: 0, count: 3 }],
      })
      .mockResolvedValueOnce({
        total: 6,
        due: 0,
        mastered: 2,
        highWrongCount: 0,
        levels: [{ level: 1, count: 4 }],
      });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [
            makeCollection({ id: "c1", name: "Alpha" }),
            makeCollection({ id: "c2", name: "Beta" }),
            makeCollection({ id: "c3", name: "Gamma" }),
          ],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.toggleCollection("c3");
    });

    expect(result.current.activeCollectionIds).toEqual(["c1", "c2"]);

    await waitFor(() => {
      expect(result.current.progress?.total).toBe(10);
    });

    expect(result.current.progress).toMatchObject({
      total: 10,
      masteredCount: 3,
      newCount: 3,
      learningCount: 4,
    });
  });

  it("loads oxford summary for the default all-bands selection", async () => {
    mocks.getOxfordProgressSummary.mockResolvedValue(oxfordSummary);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [],
          isAuthenticated: true,
          source: "oxford",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.progress).toEqual(oxfordSummary);
    });

    expect(mocks.getOxfordProgressSummary).toHaveBeenCalledWith("token", {
      band: undefined,
      signal: expect.any(AbortSignal),
    });
  });

  it("loads a single oxford band after toggling down to one", async () => {
    mocks.getOxfordProgressSummary.mockResolvedValue(oxfordSummary);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [],
          isAuthenticated: true,
          source: "oxford",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    for (const band of OXFORD_BANDS.slice(1)) {
      act(() => {
        result.current.toggleBand(band);
      });
    }

    expect(result.current.activeBandIds).toEqual(["A1"]);

    await waitFor(() => {
      expect(result.current.progress).toEqual(oxfordSummary);
    });

    expect(mocks.getOxfordProgressSummary).toHaveBeenCalledWith("token", {
      band: "A1",
      signal: expect.any(AbortSignal),
    });
  });

  it("merges multi-band oxford summaries", async () => {
    mocks.getOxfordProgressSummary.mockImplementation(
      async (_token: string, options?: { band?: string }) => {
        if (options?.band === "A1") {
          return {
            total: 4,
            masteredCount: 1,
            learningCount: 2,
            newCount: 1,
            levelCounts: Array.from({ length: 7 }, (_, index) => ({
              level: index + 1,
              count: index === 0 ? 2 : 0,
            })),
          };
        }
        if (options?.band === "A2") {
          return {
            total: 6,
            masteredCount: 2,
            learningCount: 3,
            newCount: 1,
            levelCounts: Array.from({ length: 7 }, (_, index) => ({
              level: index + 1,
              count: index === 1 ? 3 : 0,
            })),
          };
        }
        return oxfordSummary;
      },
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [],
          isAuthenticated: true,
          source: "oxford",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    // Keep only A1 and A2 selected (deselect the rest)
    for (const band of OXFORD_BANDS.slice(2)) {
      act(() => {
        result.current.toggleBand(band);
      });
    }

    expect(result.current.activeBandIds).toEqual(["A1", "A2"]);

    await waitFor(() => {
      expect(result.current.progress?.total).toBe(10);
    });

    expect(result.current.progress).toMatchObject({
      total: 10,
      masteredCount: 3,
      learningCount: 5,
      newCount: 2,
    });
  });

  it("returns empty oxford progress when no bands are selected", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [],
          isAuthenticated: true,
          source: "oxford",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    for (const band of OXFORD_BANDS) {
      act(() => {
        result.current.toggleBand(band);
      });
    }

    expect(result.current.activeBandIds).toEqual([]);
    expect(result.current.progress).toEqual(EMPTY_PROGRESS);
  });

  it("surfaces vocab errors for collection source", () => {
    mocks.useVocabStats.mockReturnValue({
      error: "Cannot load dashboard.",
      isLoading: false,
      reload: vi.fn(),
      stats: null,
    });
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [makeCollection({ id: "c1", name: "Alpha" })],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.error).toBe("Cannot load dashboard.");
  });

  it("maps multi-collection query failures", async () => {
    mocks.getVocabStats
      .mockRejectedValueOnce(new ApiError("Collection missing", 404))
      .mockResolvedValueOnce(vocabStats);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [
            makeCollection({ id: "c1", name: "Alpha" }),
            makeCollection({ id: "c2", name: "Beta" }),
            makeCollection({ id: "c3", name: "Gamma" }),
          ],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.toggleCollection("c3");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Collection missing");
    });
  });

  it("maps generic multi-query errors", async () => {
    mocks.getVocabStats
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(vocabStats);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [
            makeCollection({ id: "c1", name: "Alpha" }),
            makeCollection({ id: "c2", name: "Beta" }),
            makeCollection({ id: "c3", name: "Gamma" }),
          ],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.toggleCollection("c3");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Cannot load dashboard.");
    });
  });

  it("restores all selection when the last missing id is re-toggled", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useReviewProgress({
          collections: [
            makeCollection({ id: "c1", name: "Alpha" }),
            makeCollection({ id: "c2", name: "Beta" }),
          ],
          isAuthenticated: true,
          source: "collection",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.toggleCollection("c2");
    });
    expect(result.current.activeCollectionIds).toEqual(["c1"]);

    act(() => {
      result.current.toggleCollection("c2");
    });
    // null full selection expands back to all ids
    expect(result.current.activeCollectionIds).toEqual(["c1", "c2"]);
  });
});

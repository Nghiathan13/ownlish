import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useDifficultReviewWords } from "./useDifficultReviewWords";

const mocks = vi.hoisted(() => ({
  getDifficultReviewWords: vi.fn(),
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<unknown> }) =>
      request("token"),
  ),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: mocks.runAuthenticatedRequest,
}));

vi.mock("@/entities/review", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/review")>()),
  getDifficultReviewWords: mocks.getDifficultReviewWords,
}));

describe("useDifficultReviewWords", () => {
  beforeEach(() => {
    mocks.getDifficultReviewWords.mockReset();
    mocks.runAuthenticatedRequest.mockClear();
  });

  it("does not fetch when disabled or unauthenticated", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useDifficultReviewWords({
          enabled: false,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.words).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mocks.getDifficultReviewWords).not.toHaveBeenCalled();
  });

  it("loads words when enabled and authenticated", async () => {
    mocks.getDifficultReviewWords.mockResolvedValue([
      { id: "w1", word: "ample" },
    ]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useDifficultReviewWords({
          enabled: true,
          isAuthenticated: true,
          source: "oxford",
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.words).toEqual([{ id: "w1", word: "ample" }]);
    expect(result.current.error).toBeNull();
    expect(mocks.getDifficultReviewWords).toHaveBeenCalledWith("token", {
      signal: expect.any(AbortSignal),
      source: "oxford",
    });
  });

  it("maps ApiError and generic errors", async () => {
    mocks.getDifficultReviewWords.mockRejectedValue(
      new ApiError("Rate limited", 429),
    );
    const queryClient = createTestQueryClient();

    const { result: apiErrorResult } = renderHook(
      () =>
        useDifficultReviewWords({
          enabled: true,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(apiErrorResult.current.error).toBe("Rate limited");
    });

    mocks.getDifficultReviewWords.mockRejectedValue(new Error("network"));
    const otherClient = createTestQueryClient();
    const { result: genericResult } = renderHook(
      () =>
        useDifficultReviewWords({
          enabled: true,
          isAuthenticated: true,
          userId: "user-2",
        }),
      { wrapper: createQueryClientWrapper(otherClient) },
    );

    await waitFor(() => {
      expect(genericResult.current.error).toBe("Cannot load difficult words.");
    });
  });
});

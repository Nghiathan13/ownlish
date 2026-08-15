import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useOxfordProgressSummary } from "./useOxfordProgressSummary";

const mocks = vi.hoisted(() => ({
  getOxfordProgressSummary: vi.fn(),
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<unknown> }) =>
      request("token"),
  ),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: mocks.runAuthenticatedRequest,
}));

vi.mock("@/entities/collection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/collection")>()),
  getOxfordProgressSummary: mocks.getOxfordProgressSummary,
}));

const summary = {
  total: 10,
  masteredCount: 2,
  learningCount: 5,
  newCount: 3,
  levelCounts: Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: index === 0 ? 5 : 0,
  })),
};

describe("useOxfordProgressSummary", () => {
  beforeEach(() => {
    mocks.getOxfordProgressSummary.mockReset();
    mocks.runAuthenticatedRequest.mockClear();
  });

  it("stays idle when disabled", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useOxfordProgressSummary({
          enabled: false,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.summary).toBeNull();
    expect(mocks.getOxfordProgressSummary).not.toHaveBeenCalled();
  });

  it("loads all-band summary without a band filter", async () => {
    mocks.getOxfordProgressSummary.mockResolvedValue(summary);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useOxfordProgressSummary({
          enabled: true,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.summary).toEqual(summary);
    });

    expect(mocks.getOxfordProgressSummary).toHaveBeenCalledWith("token", {
      band: undefined,
      signal: expect.any(AbortSignal),
    });
  });

  it("passes a concrete band to the API", async () => {
    mocks.getOxfordProgressSummary.mockResolvedValue(summary);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useOxfordProgressSummary({
          band: "B1",
          enabled: true,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.getOxfordProgressSummary).toHaveBeenCalledWith("token", {
      band: "B1",
      signal: expect.any(AbortSignal),
    });
  });

  it("maps ApiError and generic errors", async () => {
    mocks.getOxfordProgressSummary.mockRejectedValue(
      new ApiError("Forbidden", 403),
    );
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useOxfordProgressSummary({
          enabled: true,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Forbidden");
    });

    mocks.getOxfordProgressSummary.mockRejectedValue(new Error("boom"));
    const otherClient = createTestQueryClient();
    const { result: genericResult } = renderHook(
      () =>
        useOxfordProgressSummary({
          enabled: true,
          isAuthenticated: true,
          userId: "user-2",
        }),
      { wrapper: createQueryClientWrapper(otherClient) },
    );

    await waitFor(() => {
      expect(genericResult.current.error).toBe("Cannot load Oxford progress.");
    });
  });
});

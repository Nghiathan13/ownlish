import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api";

const mocks = vi.hoisted(() => ({
  getStudyTimeLeaderboard: vi.fn(),
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<unknown> }) =>
      request("token"),
  ),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: mocks.runAuthenticatedRequest,
}));

vi.mock("@/entities/leaderboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/leaderboard")>()),
  getStudyTimeLeaderboard: mocks.getStudyTimeLeaderboard,
}));

import { useStudyTimeLeaderboard } from "./useStudyTimeLeaderboard";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useStudyTimeLeaderboard", () => {
  beforeEach(() => {
    mocks.getStudyTimeLeaderboard.mockReset();
    mocks.runAuthenticatedRequest.mockClear();
  });

  it("does not request study time while the Experience V2 tab is active", () => {
    renderHook(
      () =>
        useStudyTimeLeaderboard({
          anchor: null,
          enabled: false,
          isAuthenticated: true,
          period: "all",
          userId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    expect(mocks.getStudyTimeLeaderboard).not.toHaveBeenCalled();
  });

  it("loads the selected study-time range", async () => {
    mocks.getStudyTimeLeaderboard.mockResolvedValue({
      period: "all",
      startsOn: null,
      endsOn: null,
      entries: [],
    });

    const { result } = renderHook(
      () =>
        useStudyTimeLeaderboard({
          anchor: null,
          enabled: true,
          isAuthenticated: true,
          period: "all",
          userId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.leaderboard).not.toBeNull());
    expect(mocks.getStudyTimeLeaderboard).toHaveBeenCalledWith("token", {
      anchor: null,
      period: "all",
      signal: expect.any(AbortSignal),
    });
  });

  it("preserves API errors and gives unknown failures a safe fallback message", async () => {
    mocks.getStudyTimeLeaderboard.mockRejectedValueOnce(
      new ApiError("Leaderboard is unavailable.", 503),
    );
    const apiError = renderHook(
      () =>
        useStudyTimeLeaderboard({
          anchor: null,
          enabled: true,
          isAuthenticated: true,
          period: "all",
          userId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(apiError.result.current.error).toBe("Leaderboard is unavailable."),
    );

    mocks.getStudyTimeLeaderboard.mockRejectedValueOnce(new Error("unexpected"));
    const unknownError = renderHook(
      () =>
        useStudyTimeLeaderboard({
          anchor: "2026-08-10",
          enabled: true,
          isAuthenticated: true,
          period: "week",
          userId: "user-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(unknownError.result.current.error).toBe("Cannot load leaderboard."),
    );
  });
});

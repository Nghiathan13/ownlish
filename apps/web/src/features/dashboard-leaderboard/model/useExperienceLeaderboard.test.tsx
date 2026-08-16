import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getExperienceLeaderboard = vi.hoisted(() => vi.fn());
vi.mock("@/entities/leaderboard", () => ({ getExperienceLeaderboard }));
vi.mock("@/entities/session", () => ({
  runAuthenticatedRequest: ({ request }: { request: (token: string) => unknown }) => request("token"),
}));

import { useExperienceLeaderboard } from "./useExperienceLeaderboard";

describe("useExperienceLeaderboard", () => {
  it("has one all-time cache key and no period input", async () => {
    getExperienceLeaderboard.mockResolvedValue({ entries: [] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useExperienceLeaderboard({ enabled: true, isAuthenticated: true, userId: "user-1" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.leaderboard).toEqual({ entries: [] }));
    expect(getExperienceLeaderboard).toHaveBeenCalledWith("token", expect.any(AbortSignal));
    expect(client.getQueryCache().getAll()[0]?.queryKey).toEqual([
      "leaderboard",
      "experience",
    ]);
  });
});

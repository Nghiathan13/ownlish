import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMockTestHistory } from "./useMockTestHistory";

const listRuntimeMockRuns = vi.hoisted(() => vi.fn());

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  listRuntimeMockRuns,
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: ({
    request,
  }: {
    request: (token: string) => unknown;
  }) => request("token"),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useMockTestHistory", () => {
  it("loads mock history when authenticated", async () => {
    listRuntimeMockRuns.mockResolvedValue([
      { sessionId: "session-1", selectedParts: [1], status: "open" },
    ]);

    const { result } = renderHook(
      () =>
        useMockTestHistory({
          isAuthenticated: true,
          userId: "user-1",
          testKey: "ets-2023-1",
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(listRuntimeMockRuns).toHaveBeenCalledWith("token", "ets-2023-1");
  });

  it("does not fetch when unauthenticated", () => {
    listRuntimeMockRuns.mockClear();

    renderHook(
      () =>
        useMockTestHistory({
          isAuthenticated: false,
          userId: null,
          testKey: "ets-2023-1",
        }),
      { wrapper },
    );

    expect(listRuntimeMockRuns).not.toHaveBeenCalled();
  });
});

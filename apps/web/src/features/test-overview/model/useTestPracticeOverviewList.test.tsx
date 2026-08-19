import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import { useTestPracticeOverviewList } from "./useTestPracticeOverviewList";

const listRuntimeTestPracticeRuns = vi.hoisted(() => vi.fn());

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  listRuntimeTestPracticeRuns,
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: ({
    request,
  }: {
    request: (token: string) => unknown;
  }) => request("token"),
}));

const source = {
  rootUrl: "/",
  manifest: {
    schemaVersion: 1,
    tests: [],
    partPractice: [],
    mediaByGroupId: {},
  },
} as ToeicCatalogSource;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useTestPracticeOverviewList", () => {
  it("loads test practice progress when the catalog is ready", async () => {
    listRuntimeTestPracticeRuns.mockResolvedValue([
      { testKey: "ets-2023-1", answeredCount: 3, correctCount: 2, wrongCount: 1, parts: [] },
    ]);

    const { result } = renderHook(
      () =>
        useTestPracticeOverviewList({
          isAuthenticated: true,
          userId: "user-1",
          source,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.progress).toHaveLength(1));
    expect(listRuntimeTestPracticeRuns).toHaveBeenCalledWith("token");
  });
});

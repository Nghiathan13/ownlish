import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import { usePartPracticeOverviewList } from "./usePartPracticeOverviewList";

const listRuntimePartPracticeRuns = vi.hoisted(() => vi.fn());

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  listRuntimePartPracticeRuns,
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
    partPractice: [
      { number: 1, path: "p1", questionCount: 6 },
      { number: 3, path: "p3", questionCount: 39 },
    ],
    mediaByGroupId: {},
  },
} as ToeicCatalogSource;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("usePartPracticeOverviewList", () => {
  it("joins catalog parts with practice progress", async () => {
    listRuntimePartPracticeRuns.mockResolvedValue([
      { partNumber: 3, answeredCount: 4, correctCount: 3, wrongCount: 1 },
    ]);

    const { result } = renderHook(
      () =>
        usePartPracticeOverviewList({
          isAuthenticated: true,
          userId: "user-1",
          source,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.summaries).toHaveLength(2));
    expect(result.current.summaries).toEqual([
      { partNumber: 1, total: 6, answered: 0, correct: 0, wrong: 0 },
      { partNumber: 3, total: 39, answered: 4, correct: 3, wrong: 1 },
    ]);
  });
});

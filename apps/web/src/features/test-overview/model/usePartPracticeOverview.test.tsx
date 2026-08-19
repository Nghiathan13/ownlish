import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePartPracticeOverview } from "./usePartPracticeOverview";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useToeicCatalogQuery: vi.fn(),
  usePartPracticeOverviewList: vi.fn(),
  startRun: vi.fn(),
  clearHistory: vi.fn(),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/entities/toeic-catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-catalog")>()),
  useToeicCatalogQuery: mocks.useToeicCatalogQuery,
}));

vi.mock("./usePartPracticeOverviewList", () => ({
  usePartPracticeOverviewList: mocks.usePartPracticeOverviewList,
}));

vi.mock("./useStartPartPracticeRun", () => ({
  useStartPartPracticeRun: () => ({
    startRun: mocks.startRun,
    isStarting: false,
    startingPartNumber: null,
  }),
}));

vi.mock("./useClearPartPracticeHistory", () => ({
  useClearPartPracticeHistory: () => ({
    clearHistory: mocks.clearHistory,
    isClearing: false,
    clearingPartNumber: null,
  }),
}));

const source = { manifest: { partPractice: [] } };

describe("usePartPracticeOverview", () => {
  it("starts part practice for the selected part", async () => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useToeicCatalogQuery.mockReturnValue({
      data: source,
      isLoading: false,
      error: null,
    });
    mocks.usePartPracticeOverviewList.mockReturnValue({
      summaries: [
        { partNumber: 3, total: 10, answered: 4, correct: 3, wrong: 1 },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    mocks.startRun.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePartPracticeOverview(3));

    expect(result.current.selectedSummary).toEqual({
      partNumber: 3,
      total: 10,
      answered: 4,
      correct: 3,
      wrong: 1,
    });

    await act(async () => {
      await result.current.startPartPractice(3, "practice");
    });
    expect(mocks.startRun).toHaveBeenCalledWith({
      partNumber: 3,
      mode: "practice",
      source,
    });
  });

  it("confirms clearing history for a pending part", async () => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useToeicCatalogQuery.mockReturnValue({
      data: source,
      isLoading: false,
      error: null,
    });
    mocks.usePartPracticeOverviewList.mockReturnValue({
      summaries: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    mocks.clearHistory.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePartPracticeOverview(3));

    act(() => {
      result.current.requestClearHistory(3);
    });
    expect(result.current.pendingClearPartNumber).toBe(3);

    await act(async () => {
      await result.current.confirmClearHistory();
    });
    expect(mocks.clearHistory).toHaveBeenCalledWith(3);
    expect(result.current.pendingClearPartNumber).toBeNull();
  });
});

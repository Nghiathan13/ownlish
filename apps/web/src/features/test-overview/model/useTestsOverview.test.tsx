import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { useTestsOverview } from "./useTestsOverview";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useToeicCatalogQuery: vi.fn(),
  useTestPracticeOverviewList: vi.fn(),
  startRun: vi.fn(),
  prepareRuntimeMockRun: vi.fn(),
  clearRuntimeTestPracticeRun: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
  runAuthenticatedRequest: ({
    request,
  }: {
    request: (token: string) => unknown;
  }) => request("token"),
}));

vi.mock("@/entities/toeic-catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-catalog")>()),
  useToeicCatalogQuery: mocks.useToeicCatalogQuery,
}));

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  prepareRuntimeMockRun: mocks.prepareRuntimeMockRun,
  clearRuntimeTestPracticeRun: mocks.clearRuntimeTestPracticeRun,
}));

vi.mock("@/features/test-study/@x/test-overview", () => ({
  useStartRuntimeTestRun: () => ({
    startRun: mocks.startRun,
    isStarting: false,
    startingTestKey: null,
  }),
}));

vi.mock("./useTestPracticeOverviewList", () => ({
  useTestPracticeOverviewList: mocks.useTestPracticeOverviewList,
}));

const catalogTest = {
  id: "ets-2023-1",
  series: "ETS",
  year: 2023,
  testNumber: 1,
  complete: true,
  parts: [{ number: 1, path: "p1", questionCount: 6 }],
};

const source = {
  rootUrl: "/",
  manifest: {
    schemaVersion: 1,
    tests: [
      catalogTest,
      { ...catalogTest, id: "ets-2024-1", year: 2024, testNumber: 2 },
    ],
    partPractice: [],
    mediaByGroupId: {},
  },
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LocaleProvider>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}

describe("useTestsOverview", () => {
  beforeEach(() => {
    mocks.startRun.mockReset();
    mocks.prepareRuntimeMockRun.mockReset();
    mocks.clearRuntimeTestPracticeRun.mockReset();
    mocks.push.mockReset();
  });

  it("filters catalog tests for the selected year and starts practice", async () => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useToeicCatalogQuery.mockReturnValue({
      data: source,
      error: null,
    });
    mocks.useTestPracticeOverviewList.mockReturnValue({
      progress: [
        {
          testKey: "ets-2023-1",
          answeredCount: 2,
          correctCount: 1,
          wrongCount: 1,
          parts: [{ partNumber: 1, correctCount: 1, wrongCount: 1 }],
        },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    mocks.startRun.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTestsOverview(2023), { wrapper });

    expect(result.current.tests).toHaveLength(1);
    expect(result.current.tests[0]?.catalog.id).toBe("ets-2023-1");
    expect(result.current.tests[0]?.parts[0]).toEqual({
      partNumber: 1,
      partCorrectCount: 1,
      partWrongCount: 1,
    });

    await act(async () => {
      await result.current.startTest(result.current.tests[0]!, [1], "practice");
    });
    expect(mocks.startRun).toHaveBeenCalledWith({
      test: catalogTest,
      source,
      partNumbers: [1],
      mode: "practice",
    });
  });

  it("keeps an existing mock run instead of starting a new one", async () => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useToeicCatalogQuery.mockReturnValue({
      data: source,
      error: null,
    });
    mocks.useTestPracticeOverviewList.mockReturnValue({
      progress: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
    mocks.prepareRuntimeMockRun.mockResolvedValue({
      status: "open",
      run: { sessionId: "session-open", selectedParts: [1, 2] },
    });

    const { result } = renderHook(() => useTestsOverview(2023), { wrapper });

    await act(async () => {
      await result.current.startMock(result.current.tests[0]!, [1, 2], 45);
    });

    expect(result.current.pendingMockRun).toMatchObject({
      sessionId: "session-open",
      status: "open",
      partNumbers: [1, 2],
      timeLimitMinutes: 45,
    });
    expect(mocks.startRun).not.toHaveBeenCalled();
  });
});

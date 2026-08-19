import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import { useStartPartPracticeRun } from "./useStartPartPracticeRun";

const mocks = vi.hoisted(() => ({
  createRuntimePartPracticeRun: vi.fn(),
  getFirstPartPracticeGroupKey: vi.fn(),
  preloadCatalogGroupMedia: vi.fn(),
  readPartPracticeGroupKey: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  createRuntimePartPracticeRun: mocks.createRuntimePartPracticeRun,
  readPartPracticeGroupKey: mocks.readPartPracticeGroupKey,
}));

vi.mock("@/entities/toeic-catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-catalog")>()),
  getFirstPartPracticeGroupKey: mocks.getFirstPartPracticeGroupKey,
  preloadCatalogGroupMedia: mocks.preloadCatalogGroupMedia,
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
    partPractice: [{ number: 3, path: "p3", questionCount: 39 }],
    mediaByGroupId: {},
  },
} as ToeicCatalogSource;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useStartPartPracticeRun", () => {
  it("creates a run, preloads media, and navigates", async () => {
    mocks.createRuntimePartPracticeRun.mockResolvedValue({
      sessionId: "session-1",
    });
    mocks.readPartPracticeGroupKey.mockReturnValue(null);
    mocks.getFirstPartPracticeGroupKey.mockReturnValue("group-3");

    const { result } = renderHook(
      () => useStartPartPracticeRun({ userId: "user-1" }),
      { wrapper },
    );

    await act(async () => {
      await result.current.startRun({
        partNumber: 3,
        mode: "practice",
        source,
      });
    });

    expect(mocks.createRuntimePartPracticeRun).toHaveBeenCalledWith("token", 3);
    expect(mocks.preloadCatalogGroupMedia).toHaveBeenCalledWith(source, "group-3");
    expect(mocks.push).toHaveBeenCalledWith(
      "/tests/part-practice/session-1?mode=practice&part=3",
    );
  });
});

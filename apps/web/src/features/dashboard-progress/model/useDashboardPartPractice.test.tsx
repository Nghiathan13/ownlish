import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useDashboardPartPractice } from "./useDashboardPartPractice";

const mocks = vi.hoisted(() => ({
  listRuntimePartPracticeRuns: vi.fn(),
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<unknown> }) =>
      request("token"),
  ),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: mocks.runAuthenticatedRequest,
}));

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  listRuntimePartPracticeRuns: mocks.listRuntimePartPracticeRuns,
}));

describe("useDashboardPartPractice", () => {
  beforeEach(() => {
    mocks.listRuntimePartPracticeRuns.mockReset();
    mocks.runAuthenticatedRequest.mockClear();
  });

  it("does not fetch when unauthenticated", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useDashboardPartPractice({
          isAuthenticated: false,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.summaries).toEqual([]);
    expect(mocks.listRuntimePartPracticeRuns).not.toHaveBeenCalled();
  });

  it("maps runtime runs into dashboard summaries", async () => {
    mocks.listRuntimePartPracticeRuns.mockResolvedValue([
      {
        partNumber: 2,
        answeredCount: 10,
        correctCount: 7,
        wrongCount: 3,
      },
    ]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useDashboardPartPractice({
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.summaries).toEqual([
        {
          partNumber: 2,
          answered: 10,
          correct: 7,
          wrong: 3,
        },
      ]);
    });

    expect(result.current.error).toBeNull();
  });

  it("maps ApiError and generic errors", async () => {
    mocks.listRuntimePartPracticeRuns.mockRejectedValue(
      new ApiError("Server down", 500),
    );
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useDashboardPartPractice({
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Server down");
    });

    mocks.listRuntimePartPracticeRuns.mockRejectedValue(new Error("timeout"));
    const otherClient = createTestQueryClient();
    const { result: genericResult } = renderHook(
      () =>
        useDashboardPartPractice({
          isAuthenticated: true,
          userId: "user-2",
        }),
      { wrapper: createQueryClientWrapper(otherClient) },
    );

    await waitFor(() => {
      expect(genericResult.current.error).toBe(
        "Cannot load Part Practice progress.",
      );
    });
  });
});

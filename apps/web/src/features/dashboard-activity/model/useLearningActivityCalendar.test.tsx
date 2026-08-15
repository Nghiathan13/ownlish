import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useLearningActivityCalendar } from "./useLearningActivityCalendar";

const mocks = vi.hoisted(() => ({
  getLearningActivityCalendar: vi.fn(),
  runAuthenticatedRequest: vi.fn(
    async ({ request }: { request: (token: string) => Promise<unknown> }) =>
      request("token"),
  ),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: mocks.runAuthenticatedRequest,
}));

vi.mock("@/entities/learning-activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/learning-activity")>()),
  getLearningActivityCalendar: mocks.getLearningActivityCalendar,
}));

describe("useLearningActivityCalendar", () => {
  beforeEach(() => {
    mocks.getLearningActivityCalendar.mockReset();
    mocks.runAuthenticatedRequest.mockClear();
  });

  it("does not fetch without auth or user", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useLearningActivityCalendar({
          isAuthenticated: false,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    expect(result.current.calendar).toBeNull();
    expect(mocks.getLearningActivityCalendar).not.toHaveBeenCalled();
  });

  it("loads calendar data when authenticated", async () => {
    const calendar = {
      days: [{ learnedOn: "2026-07-01", seconds: 60, activityType: "review" }],
    };
    mocks.getLearningActivityCalendar.mockResolvedValue(calendar);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        useLearningActivityCalendar({
          isAuthenticated: true,
          userId: "user-1",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.calendar).toEqual(calendar);
    });

    expect(mocks.getLearningActivityCalendar).toHaveBeenCalledWith(
      "token",
      expect.any(AbortSignal),
    );
    expect(result.current.isLoading).toBe(false);
  });
});

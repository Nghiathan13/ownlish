import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ToeicRunResult } from "@/entities/toeic/api/types";
import { usePracticeRunQuery } from "@/entities/toeic/hooks/usePracticeRunQuery";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";

const apiMocks = vi.hoisted(() => ({
  expandToeicRunParts: vi.fn(),
  getToeicRun: vi.fn(),
}));

vi.mock("@/entities/toeic/api/toeic", () => apiMocks);

vi.mock("@/entities/session/model/authenticatedRequest", () => ({
  runAuthenticatedRequest: ({
    request,
  }: {
    request: (token: string) => unknown;
  }) => request("access-token"),
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: () => true,
  useAuthSession: () => ({ status: "authenticated" }),
}));

const SESSION_ID = "00000000-0000-4000-8000-000000000003";

function createPracticeRun(): ToeicRunResult {
  return {
    sessionId: SESSION_ID,
    mode: "practice",
    testId: 1,
    year: 2026,
    partNumbers: [1, 2],
    totalQuestions: 0,
    correctCount: 0,
    wrongCount: 0,
    completedAt: null,
    groups: [],
  };
}

describe("usePracticeRunQuery", () => {
  it("loads a persisted practice run with one GET and no mutation", async () => {
    const session = createPracticeRun();
    apiMocks.expandToeicRunParts.mockResolvedValue(session);
    apiMocks.getToeicRun.mockResolvedValue(session);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () =>
        usePracticeRunQuery({
          enabled: true,
          mode: "practice",
          selectedParts: [2, 1],
          sessionId: SESSION_ID,
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.data).toBe(session));

    expect(apiMocks.getToeicRun).toHaveBeenCalledTimes(1);
    expect(apiMocks.getToeicRun).toHaveBeenCalledWith(
      "access-token",
      SESSION_ID,
      {
        mode: "practice",
        parts: [2, 1],
      },
    );
    expect(apiMocks.expandToeicRunParts).not.toHaveBeenCalled();
  });
});

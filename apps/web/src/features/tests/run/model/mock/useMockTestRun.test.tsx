import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ToeicRunResult } from "@/entities/toeic/api/types";
import {
  clearStoredAccessToken,
  setStoredAccessToken,
} from "@/entities/session/model/accessTokenStore";
import {
  readMockFinishCommand,
  storeMockFinishCommand,
} from "@/features/tests/run/model/mock/mockFinishOutbox";
import { useMockTestRun } from "@/features/tests/run/model/mock/useMockTestRun";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";
import { mswServer } from "@/shared/lib/testing/mswServer";

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: () => true,
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-id" },
  }),
}));

const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const FINISH_URL = `http://localhost:3001/tests/runs/${SESSION_ID}/finish`;
const RUN_URL = `http://localhost:3001/tests/runs/${SESSION_ID}`;

function createAccessToken() {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${encode("{}")}.${encode(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  )}.signature`;
}

function createFinishedRun(): ToeicRunResult {
  return {
    sessionId: SESSION_ID,
    mode: "mock_test",
    testId: 1,
    year: 2026,
    partNumbers: [5],
    totalQuestions: 1,
    correctCount: 1,
    wrongCount: 0,
    completedAt: "2026-07-14T00:00:00.000Z",
    groups: [
      {
        id: 11,
        partNumber: 5,
        questionStart: 1,
        questionEnd: 1,
        groupStatus: "right",
        groupType: null,
        accent: null,
        content: "A short passage.",
        contentVi: null,
        audioUrl: null,
        audioUrlExpiresAt: null,
        imageUrl: null,
        imageUrlExpiresAt: null,
        questions: [
          {
            id: 101,
            questionNumber: 1,
            sessionQuestionNumber: 1,
            question: "Choose an answer.",
            questionVi: null,
            options: {
              A: "Alpha",
              B: "Beta",
              C: null,
              D: null,
              A_vi: null,
              B_vi: null,
              C_vi: null,
              D_vi: null,
            },
            optionCount: 2,
            answerKey: "A",
            selectedKey: "A",
            status: "right",
            isCorrect: true,
          },
        ],
      },
    ],
  };
}

describe("useMockTestRun Finish recovery", () => {
  beforeEach(() => {
    setStoredAccessToken(createAccessToken());
    window.localStorage.clear();
  });

  afterEach(() => {
    clearStoredAccessToken();
    window.localStorage.clear();
  });

  it("waits for the stored Finish command before loading the canonical session", async () => {
    const finishResponse = Promise.withResolvers<void>();
    let finishRequestCount = 0;
    let getRequestCount = 0;
    storeMockFinishCommand(SESSION_ID);

    mswServer.use(
      http.patch(FINISH_URL, async () => {
        finishRequestCount += 1;
        await finishResponse.promise;
        return HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(createFinishedRun());
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () => useMockTestRun({ selectedParts: [5], sessionId: SESSION_ID }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(finishRequestCount).toBe(1));
    expect(getRequestCount).toBe(0);
    expect(result.current.isLoading).toBe(true);

    finishResponse.resolve();

    await waitFor(() => expect(result.current.isFinished).toBe(true));

    expect(getRequestCount).toBe(1);
    expect(result.current.isResultOpen).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("keeps GET blocked after recovery failure and retries the same command", async () => {
    let finishRequestCount = 0;
    let getRequestCount = 0;
    storeMockFinishCommand(SESSION_ID);

    mswServer.use(
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return finishRequestCount === 1
          ? HttpResponse.json({ message: "Finish failed." }, { status: 500 })
          : HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(createFinishedRun());
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () => useMockTestRun({ selectedParts: [5], sessionId: SESSION_ID }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isFinishFailureOpen).toBe(true));
    expect(getRequestCount).toBe(0);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    await act(async () => {
      await result.current.finishRun();
    });

    await waitFor(() => expect(result.current.isFinished).toBe(true));
    expect(finishRequestCount).toBe(2);
    expect(getRequestCount).toBe(1);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });
});

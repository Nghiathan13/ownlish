import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeTestSession } from "@/entities/toeic-runtime/model/materializeTestSession";
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

const queryMocks = vi.hoisted(() => ({ useMockRunQuery: vi.fn() }));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: () => true,
  useAuthSession: () => ({ status: "authenticated", user: { id: "user-id" } }),
}));

vi.mock("@/features/tests/run/model/mock/useMockRunQuery", () => ({
  useMockRunQuery: queryMocks.useMockRunQuery,
}));

const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const QUERY_KEY = ["runtime-test-session", SESSION_ID, "mock_test"] as const;
const FINISH_URL = `http://localhost:3001/tests/runtime/runs/${SESSION_ID}/finish`;

function createAccessToken() {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${encode("{}")}\.${encode(payload)}.signature`;
}

function createRun(): RuntimeTestSession {
  return {
    sessionId: SESSION_ID,
    testKey: "ets26-t01",
    series: "ets_26",
    year: 2026,
    testNumber: 1,
    mode: "mock_test",
    partNumbers: [5],
    totalQuestions: 1,
    correctCount: 0,
    wrongCount: 0,
    isFinished: false,
    groups: [
      {
        id: 11,
        partNumber: 5,
        questionStart: 1,
        questionEnd: 1,
        groupStatus: null,
        groupType: null,
        accent: null,
        content: "A short passage.",
        contentVi: null,
        audioUrl: null,
        audioUrlExpiresAt: null,
        imageUrl: null,
        imageUrlExpiresAt: null,
        questions: [{
          id: 101,
          questionNumber: 1,
          sessionQuestionNumber: 1,
          question: "Choose an answer.",
          questionVi: null,
          options: { A: "Alpha", B: "Beta", C: null, D: null, A_vi: null, B_vi: null, C_vi: null, D_vi: null },
          optionCount: 2,
          answerKey: "A",
          selectedKey: "A",
          status: "selected",
          isCorrect: null,
        }],
      },
    ],
    questionKeyById: new Map([[101, "ets26-t01-p5-q001"]]),
    groupKeyById: new Map([[11, "ets26-t01-p5-g001"]]),
  };
}

describe("useMockTestRun", () => {
  beforeEach(() => {
    setStoredAccessToken(createAccessToken());
    window.localStorage.clear();
    queryMocks.useMockRunQuery.mockReturnValue({
      data: createRun(),
      error: null,
      isLoading: false,
      isFetching: false,
      queryKey: QUERY_KEY,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    clearStoredAccessToken();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the optimistic result after the runtime API accepts Finish", async () => {
    mswServer.use(
      http.patch(FINISH_URL, () =>
        HttpResponse.json({ status: "completed" }),
      ),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(QUERY_KEY, createRun());
    const { result } = renderHook(() => useMockTestRun({ sessionId: SESSION_ID }), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    await act(async () => result.current.finishRun());

    expect(result.current.isFinishAccepted).toBe(true);
    expect(result.current.isResultOpen).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("replays a persisted Finish command before loading the run", async () => {
    storeMockFinishCommand(SESSION_ID);
    mswServer.use(
      http.patch(FINISH_URL, () =>
        HttpResponse.json({ status: "completed" }),
      ),
    );
    const { result } = renderHook(() => useMockTestRun({ sessionId: SESSION_ID }), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(readMockFinishCommand(SESSION_ID)).toBeNull());
    expect(result.current.isLoading).toBe(false);
  });
});

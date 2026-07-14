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
import {
  getToeicRunQueryKey,
  useMockTestRun,
} from "@/features/tests/run/model/mock/useMockTestRun";
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

function createRun(isFinished: boolean): ToeicRunResult {
  return {
    sessionId: SESSION_ID,
    mode: "mock_test",
    testId: 1,
    year: 2026,
    partNumbers: [5],
    totalQuestions: 1,
    correctCount: isFinished ? 1 : 0,
    wrongCount: 0,
    completedAt: isFinished ? "2026-07-14T00:00:00.000Z" : null,
    groups: [
      {
        id: 11,
        partNumber: 5,
        questionStart: 1,
        questionEnd: 1,
        groupStatus: isFinished ? "right" : null,
        groupType: null,
        accent: null,
        content: "A short passage.",
        contentVi: null,
        audioUrl: "https://media.example/audio.mp3?signature=original",
        audioUrlExpiresAt: "2026-07-15T00:00:00.000Z",
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
            status: isFinished ? "right" : "selected",
            isCorrect: isFinished ? true : null,
          },
        ],
      },
    ],
  };
}

function createOptimisticRun(): ToeicRunResult {
  return {
    ...createRun(false),
    correctCount: 1,
    groups: [
      {
        ...createRun(false).groups[0]!,
        groupStatus: "right",
        questions: [
          {
            ...createRun(false).groups[0]!.questions[0]!,
            status: "right",
            isCorrect: true,
          },
        ],
      },
    ],
  };
}

describe("useMockTestRun Finish workflow", () => {
  beforeEach(() => {
    setStoredAccessToken(createAccessToken());
    window.localStorage.clear();
  });

  afterEach(() => {
    clearStoredAccessToken();
    window.localStorage.clear();
  });

  it("keeps canonical GET blocked through accepted recovery and loads once after completed", async () => {
    const canonicalResponse = Promise.withResolvers<void>();
    let finishRequestCount = 0;
    let getRequestCount = 0;
    storeMockFinishCommand(SESSION_ID);

    mswServer.use(
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        const status = finishRequestCount === 1 ? "accepted" : "completed";
        return HttpResponse.json(
          { status },
          { status: status === "accepted" ? 202 : 200 },
        );
      }),
      http.get(RUN_URL, async () => {
        getRequestCount += 1;
        await canonicalResponse.promise;
        return HttpResponse.json(createRun(true));
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      getToeicRunQueryKey(SESSION_ID),
      createOptimisticRun(),
    );
    const { result } = renderHook(
      () => useMockTestRun({ selectedParts: [5], sessionId: SESSION_ID }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(finishRequestCount).toBe(1));
    expect(getRequestCount).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isResultOpen).toBe(false);
    expect(result.current.isFinishAccepted).toBe(false);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    await act(async () => result.current.finishRun());
    await waitFor(() => expect(getRequestCount).toBe(1));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFinished).toBe(false);

    canonicalResponse.resolve();
    await waitFor(() => expect(result.current.isFinished).toBe(true));

    expect(finishRequestCount).toBe(2);
    expect(getRequestCount).toBe(1);
    expect(result.current.isResultOpen).toBe(false);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("keeps GET blocked after a pre-acceptance failure and retries the stored command", async () => {
    let finishRequestCount = 0;
    let getRequestCount = 0;
    storeMockFinishCommand(SESSION_ID);

    mswServer.use(
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return finishRequestCount === 1
          ? HttpResponse.json({ message: "Finish failed." }, { status: 500 })
          : HttpResponse.json({ status: "completed" });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(createRun(true));
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

    await act(async () => result.current.finishRun());
    await waitFor(() => expect(result.current.isFinished).toBe(true));

    expect(finishRequestCount).toBe(2);
    expect(getRequestCount).toBe(1);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("does not GET on normal completion but refetches canonical data on revisit", async () => {
    let finishRequestCount = 0;
    let getRequestCount = 0;

    mswServer.use(
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(createRun(getRequestCount > 1));
      }),
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json({ status: "completed" });
      }),
    );

    const queryClient = createTestQueryClient();
    const firstMount = renderHook(
      () => useMockTestRun({ selectedParts: [5], sessionId: SESSION_ID }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(firstMount.result.current.isLoading).toBe(false));
    await act(async () => firstMount.result.current.finishRun());

    expect(finishRequestCount).toBe(1);
    expect(getRequestCount).toBe(1);
    expect(firstMount.result.current.isFinishAccepted).toBe(true);
    expect(firstMount.result.current.isResultOpen).toBe(true);
    expect(firstMount.result.current.isFinished).toBe(false);
    expect(firstMount.result.current.sessionData?.completedAt).toBeNull();
    expect(firstMount.result.current.sessionData?.groups[0]?.audioUrl).toBe(
      "https://media.example/audio.mp3?signature=original",
    );
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();

    firstMount.unmount();
    const secondMount = renderHook(
      () => useMockTestRun({ selectedParts: [5], sessionId: SESSION_ID }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    await waitFor(() => expect(secondMount.result.current.isFinished).toBe(true));
    expect(getRequestCount).toBe(2);
  });
});

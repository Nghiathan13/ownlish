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
import { useMockRunSubmission } from "@/features/tests/run/model/mock/useMockRunSubmission";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";
import { mswServer } from "@/shared/lib/testing/mswServer";

const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const QUERY_KEY = ["runtime-test-session", SESSION_ID, "mock_test"] as const;
const ANSWER_URL = `http://localhost:3001/tests/runtime/runs/${SESSION_ID}/answers`;
const FINISH_URL = `http://localhost:3001/tests/runtime/runs/${SESSION_ID}/finish`;

function createAccessToken() {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${encode("{}")}.${encode(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  )}.signature`;
}

function createRunResult(
  overrides: Partial<ToeicRunResult> = {},
): ToeicRunResult {
  return {
    sessionId: SESSION_ID,
    mode: "mock_test",
    testId: 1,
    year: 2026,
    partNumbers: [5],
    totalQuestions: 1,
    correctCount: 0,
    wrongCount: 0,
    completedAt: null,
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
        audioUrl: "https://media.example/audio.mp3?signature=original",
        audioUrlExpiresAt: "2026-07-15T00:00:00.000Z",
        imageUrl: "https://media.example/image.jpg?signature=original",
        imageUrlExpiresAt: "2026-07-15T00:00:00.000Z",
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
            selectedKey: null,
            status: null,
            isCorrect: null,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function createTwoQuestionRun(): ToeicRunResult {
  const run = createRunResult();
  const firstQuestion = run.groups[0]!.questions[0]!;

  return {
    ...run,
    totalQuestions: 2,
    groups: [
      {
        ...run.groups[0]!,
        questionEnd: 2,
        questions: [
          { ...firstQuestion, selectedKey: "A", status: "selected" },
          {
            ...firstQuestion,
            id: 102,
            questionNumber: 2,
            sessionQuestionNumber: 2,
            answerKey: "B",
          },
        ],
      },
    ],
  };
}

function createRunWithNullableAnswerKey(): ToeicRunResult {
  const run = createTwoQuestionRun();
  const nullableQuestion = {
    ...run.groups[0]!.questions[0]!,
    id: 103,
    questionNumber: 3,
    sessionQuestionNumber: 3,
    answerKey: null,
    selectedKey: "A" as const,
    status: "selected" as const,
  };

  return {
    ...run,
    totalQuestions: 3,
    groups: [
      {
        ...run.groups[0]!,
        questionEnd: 3,
        questions: [...run.groups[0]!.questions, nullableQuestion],
      },
    ],
  };
}

function renderSubmission({
  initialData = createRunResult(),
  isAuthenticated = true,
  onFinishCompleted = () => undefined,
  shouldRecoverFinish = false,
}: {
  initialData?: ToeicRunResult | undefined;
  isAuthenticated?: boolean;
  onFinishCompleted?: () => void;
  shouldRecoverFinish?: boolean;
} = {}) {
  const queryClient = createTestQueryClient();
  if (initialData) {
    queryClient.setQueryData(QUERY_KEY, initialData);
  }

  const rendered = renderHook(
    ({ authenticated }) =>
      useMockRunSubmission({
        isAuthenticated: authenticated,
        isFinished: false,
        onFinishCompleted,
        queryKey: QUERY_KEY,
        questionKeyById: new Map([[101, "ets26-t01-p5-q001"], [102, "ets26-t01-p5-q002"]]),
        sessionId: SESSION_ID,
        shouldRecoverFinish,
      }),
    {
      initialProps: { authenticated: isAuthenticated },
      wrapper: createQueryClientWrapper(queryClient),
    },
  );

  return { ...rendered, queryClient };
}

function getRun(queryClient: ReturnType<typeof createTestQueryClient>) {
  return queryClient.getQueryData<ToeicRunResult>(QUERY_KEY);
}

function getQuestion(
  queryClient: ReturnType<typeof createTestQueryClient>,
  index = 0,
) {
  return getRun(queryClient)?.groups[0]?.questions[index];
}

function mockFinishStatuses(statuses: Array<"accepted" | "completed">) {
  let requestCount = 0;

  mswServer.use(
    http.patch(FINISH_URL, () => {
      const status = statuses[Math.min(requestCount, statuses.length - 1)]!;
      requestCount += 1;
      return HttpResponse.json(
        { status },
        { status: status === "accepted" ? 202 : 200 },
      );
    }),
  );

  return () => requestCount;
}

describe("useMockRunSubmission", () => {
  beforeEach(() => {
    setStoredAccessToken(createAccessToken());
  });

  afterEach(() => {
    vi.useRealTimers();
    clearStoredAccessToken();
    window.localStorage.clear();
  });

  it("serializes changes for one question and persists the latest intent", async () => {
    const firstResponse = Promise.withResolvers<void>();
    const secondResponse = Promise.withResolvers<void>();
    const submittedKeys: string[] = [];
    let persistedKey: string | null = null;

    mswServer.use(
      http.post(ANSWER_URL, async ({ request }) => {
        const body = (await request.json()) as { selectedKey: string };
        submittedKeys.push(body.selectedKey);
        await (submittedKeys.length === 1
          ? firstResponse.promise
          : secondResponse.promise);
        persistedKey = body.selectedKey;
        return HttpResponse.json({ graded: false });
      }),
    );

    const { result, queryClient } = renderSubmission();

    act(() => result.current.selectAnswer(101, "A"));
    await waitFor(() => expect(submittedKeys).toEqual(["A"]));

    act(() => result.current.selectAnswer(101, "B"));

    expect(getQuestion(queryClient)?.selectedKey).toBe("B");
    expect(result.current.isQuestionPending(101)).toBe(true);
    expect(submittedKeys).toEqual(["A"]);

    firstResponse.resolve();
    await waitFor(() => expect(submittedKeys).toEqual(["A", "B"]));

    secondResponse.resolve();
    await waitFor(() =>
      expect(result.current.isQuestionPending(101)).toBe(false),
    );

    expect(persistedKey).toBe("B");
    expect(getQuestion(queryClient)?.selectedKey).toBe("B");
    expect(result.current.hasSyncFailures).toBe(false);
  });

  it("queues Finish until pending answers are saved", async () => {
    const answerResponse = Promise.withResolvers<void>();
    let finishRequestCount = 0;

    mswServer.use(
      http.post(ANSWER_URL, async () => {
        await answerResponse.promise;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json({ status: "accepted" }, { status: 202 });
      }),
    );

    const { result } = renderSubmission();

    act(() => result.current.selectAnswer(101, "A"));
    await waitFor(() => expect(result.current.hasPendingAnswers).toBe(true));

    await act(async () => result.current.finishRun());

    expect(finishRequestCount).toBe(0);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();
    expect(result.current.finishError).toBeNull();

    answerResponse.resolve();
    await waitFor(() => expect(finishRequestCount).toBe(1));
  });

  it("keeps queued Finish blocked until a failed answer is saved", async () => {
    let answerShouldFail = true;
    let answerRequestCount = 0;
    const getFinishRequestCount = mockFinishStatuses(["accepted"]);

    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return answerShouldFail
          ? HttpResponse.json({ message: "Save failed." }, { status: 500 })
          : HttpResponse.json({ graded: false });
      }),
    );

    const { result } = renderSubmission();
    act(() => result.current.selectAnswer(101, "A"));
    await waitFor(() => expect(result.current.hasSyncFailures).toBe(true));

    await act(async () => result.current.finishRun());

    expect(getFinishRequestCount()).toBe(0);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    answerShouldFail = false;
    act(() => result.current.retryFailedAnswers());
    await waitFor(() => expect(result.current.hasSyncFailures).toBe(false));
    await waitFor(() => expect(result.current.hasPendingAnswers).toBe(false));
    expect(answerRequestCount).toBe(2);

    await waitFor(() => expect(getFinishRequestCount()).toBe(1));
    expect(result.current.isFinishAccepted).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();
  });

  it("grades the immutable first-Finish snapshot on 202 without replacing media or completedAt", async () => {
    const finishResponse = Promise.withResolvers<void>();
    let answerRequestCount = 0;
    let finishBody = "not observed";

    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, async ({ request }) => {
        finishBody = await request.text();
        await finishResponse.promise;
        return HttpResponse.json({ status: "accepted" }, { status: 202 });
      }),
    );

    const { result, queryClient } = renderSubmission({
      initialData: createRunWithNullableAnswerKey(),
    });
    const finishPromise = result.current.finishRun();

    act(() => result.current.selectAnswer(101, "B"));
    expect(getQuestion(queryClient)?.selectedKey).toBe("B");
    expect(answerRequestCount).toBe(0);

    finishResponse.resolve();
    await act(async () => finishPromise);

    const run = getRun(queryClient);
    expect(finishBody).toBe("");
    expect(run).toMatchObject({
      completedAt: null,
      correctCount: 1,
      wrongCount: 1,
    });
    expect(run?.groups[0]).toMatchObject({
      audioUrl: "https://media.example/audio.mp3?signature=original",
      imageUrl: "https://media.example/image.jpg?signature=original",
      groupStatus: "wrong",
    });
    expect(getQuestion(queryClient, 0)).toMatchObject({
      selectedKey: "A",
      status: "right",
      isCorrect: true,
    });
    expect(getQuestion(queryClient, 1)).toMatchObject({
      selectedKey: null,
      status: "wrong",
      isCorrect: false,
    });
    expect(getQuestion(queryClient, 2)).toMatchObject({
      answerKey: null,
      selectedKey: "A",
      status: "selected",
      isCorrect: null,
    });
    expect(result.current.isFinishAccepted).toBe(true);
    expect(result.current.isResultOpen).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();
  });

  it("handles an initial completed response optimistically and keeps the terminal guard", async () => {
    const getFinishRequestCount = mockFinishStatuses(["completed"]);
    let answerRequestCount = 0;
    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return HttpResponse.json({ graded: false });
      }),
    );
    const { result, queryClient } = renderSubmission({
      initialData: createTwoQuestionRun(),
    });

    await act(async () => result.current.finishRun());

    expect(getFinishRequestCount()).toBe(1);
    expect(result.current.isFinishAccepted).toBe(true);
    expect(result.current.isResultOpen).toBe(true);
    expect(getRun(queryClient)?.completedAt).toBeNull();
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();

    act(() => result.current.selectAnswer(101, "B"));
    await act(async () => result.current.finishRun());

    expect(getQuestion(queryClient)?.selectedKey).toBe("B");
    expect(answerRequestCount).toBe(0);
    expect(getFinishRequestCount()).toBe(1);
    expect(queryClient.getQueryState(QUERY_KEY)?.isInvalidated).toBe(true);
  });

  it("replays after 1s, 2s, then 5s and removes the outbox only on completed", async () => {
    vi.useFakeTimers();
    const getFinishRequestCount = mockFinishStatuses([
      "accepted",
      "accepted",
      "accepted",
      "completed",
    ]);
    const onFinishCompleted = vi.fn();
    const { result, unmount } = renderSubmission({ onFinishCompleted });

    await act(async () => result.current.finishRun());
    expect(getFinishRequestCount()).toBe(1);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(getFinishRequestCount()).toBe(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(getFinishRequestCount()).toBe(2);

    await act(async () => vi.advanceTimersByTimeAsync(1_999));
    expect(getFinishRequestCount()).toBe(2);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(getFinishRequestCount()).toBe(3);

    await act(async () => vi.advanceTimersByTimeAsync(4_999));
    expect(getFinishRequestCount()).toBe(3);
    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(getFinishRequestCount()).toBe(4);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    expect(result.current.isFinishAccepted).toBe(true);
    expect(result.current.isResultOpen).toBe(true);
    expect(onFinishCompleted).not.toHaveBeenCalled();

    await act(async () => result.current.finishRun());
    expect(getFinishRequestCount()).toBe(4);
    unmount();
  });

  it("keeps post-Finish choices local and does not reapply the snapshot", async () => {
    vi.useFakeTimers();
    let answerRequestCount = 0;
    const getFinishRequestCount = mockFinishStatuses([
      "accepted",
      "completed",
    ]);
    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return HttpResponse.json({ graded: false });
      }),
    );
    const { result, queryClient, unmount } = renderSubmission({
      initialData: createTwoQuestionRun(),
    });

    await act(async () => result.current.finishRun());
    act(() => result.current.selectAnswer(101, "B"));

    expect(getQuestion(queryClient)?.selectedKey).toBe("B");
    expect(answerRequestCount).toBe(0);

    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(getFinishRequestCount()).toBe(2);
    expect(getQuestion(queryClient)?.selectedKey).toBe("B");
    expect(getRun(queryClient)?.completedAt).toBeNull();
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    unmount();
  });

  it("shows a manual Retry failure before acceptance, then continues in the background", async () => {
    vi.useFakeTimers();
    let requestCount = 0;
    mswServer.use(
      http.patch(FINISH_URL, () => {
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json(
            { message: "Finish failed." },
            { status: 500 },
          );
        }
        const status = requestCount === 2 ? "accepted" : "completed";
        return HttpResponse.json(
          { status },
          { status: status === "accepted" ? 202 : 200 },
        );
      }),
    );
    const { result, unmount } = renderSubmission();

    await act(async () => result.current.finishRun());

    expect(result.current.isFinishAccepted).toBe(false);
    expect(result.current.isFinishFailureOpen).toBe(true);
    expect(result.current.isResultOpen).toBe(false);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(requestCount).toBe(1);

    await act(async () => result.current.finishRun());
    expect(requestCount).toBe(2);
    expect(result.current.isFinishFailureOpen).toBe(false);
    expect(result.current.isFinishAccepted).toBe(true);
    expect(result.current.isResultOpen).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(requestCount).toBe(3);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    unmount();
  });

  it("retains the optimistic result and retries a post-acceptance network failure", async () => {
    vi.useFakeTimers();
    let requestCount = 0;
    mswServer.use(
      http.patch(FINISH_URL, () => {
        requestCount += 1;
        if (requestCount === 2) {
          return HttpResponse.json(
            { message: "Server unavailable." },
            { status: 500 },
          );
        }
        const status = requestCount === 1 ? "accepted" : "completed";
        return HttpResponse.json(
          { status },
          { status: status === "accepted" ? 202 : 200 },
        );
      }),
    );
    const { result, unmount } = renderSubmission();

    await act(async () => result.current.finishRun());
    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(requestCount).toBe(2);
    expect(result.current.isResultOpen).toBe(true);
    expect(result.current.isFinishFailureOpen).toBe(false);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    await act(async () => vi.advanceTimersByTimeAsync(2_000));

    expect(requestCount).toBe(3);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    expect(result.current.isResultOpen).toBe(true);
    unmount();
  });

  it("waits for auth and recovers without a snapshot or result modal", async () => {
    vi.useFakeTimers();
    storeMockFinishCommand(SESSION_ID);
    const getFinishRequestCount = mockFinishStatuses([
      "accepted",
      "completed",
    ]);
    const onFinishCompleted = vi.fn();
    const { result, rerender, unmount } = renderSubmission({
      initialData: undefined,
      isAuthenticated: false,
      onFinishCompleted,
      shouldRecoverFinish: true,
    });

    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(getFinishRequestCount()).toBe(0);

    rerender({ authenticated: true });
    await act(async () => vi.advanceTimersByTimeAsync(0));

    expect(getFinishRequestCount()).toBe(1);
    expect(result.current.isResultOpen).toBe(false);
    expect(result.current.isFinishAccepted).toBe(false);

    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(getFinishRequestCount()).toBe(2);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    expect(onFinishCompleted).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("cleans a scheduled replay up on unmount", async () => {
    vi.useFakeTimers();
    const getFinishRequestCount = mockFinishStatuses(["accepted"]);
    const { result, unmount } = renderSubmission();

    await act(async () => result.current.finishRun());
    unmount();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(getFinishRequestCount()).toBe(1);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();
  });

  it("does not schedule a replay when an in-flight request accepts after unmount", async () => {
    vi.useFakeTimers();
    const finishResponse = Promise.withResolvers<void>();
    let requestCount = 0;
    mswServer.use(
      http.patch(FINISH_URL, async () => {
        requestCount += 1;
        await finishResponse.promise;
        return HttpResponse.json({ status: "accepted" }, { status: 202 });
      }),
    );
    const { result, unmount } = renderSubmission();

    const finishPromise = result.current.finishRun();
    await act(async () => vi.advanceTimersByTimeAsync(0));
    expect(requestCount).toBe(1);
    unmount();

    finishResponse.resolve();
    await finishPromise;
    await vi.advanceTimersByTimeAsync(10_000);

    expect(requestCount).toBe(1);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();
  });
});

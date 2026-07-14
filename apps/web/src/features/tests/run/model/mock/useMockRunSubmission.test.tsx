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
const QUERY_KEY = ["toeic-run", SESSION_ID] as const;
const ANSWER_URL = `http://localhost:3001/tests/runs/${SESSION_ID}/answers`;
const FINISH_URL = `http://localhost:3001/tests/runs/${SESSION_ID}/finish`;
const RUN_URL = `http://localhost:3001/tests/runs/${SESSION_ID}`;

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
            answerKey: null,
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

function renderSubmission({
  onFinishCompleted = () => undefined,
  shouldRecoverFinish = false,
}: {
  onFinishCompleted?: () => void;
  shouldRecoverFinish?: boolean;
} = {}) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(QUERY_KEY, createRunResult());

  const rendered = renderHook(
    () =>
      useMockRunSubmission({
        isAuthenticated: true,
        isFinished: false,
        onFinishCompleted,
        queryKey: QUERY_KEY,
        selectedParts: [5],
        sessionId: SESSION_ID,
        shouldRecoverFinish,
      }),
    { wrapper: createQueryClientWrapper(queryClient) },
  );

  return { ...rendered, queryClient };
}

function getSelectedKey(queryClient: ReturnType<typeof createTestQueryClient>) {
  return queryClient.getQueryData<ToeicRunResult>(QUERY_KEY)?.groups[0]
    ?.questions[0]?.selectedKey;
}

describe("useMockRunSubmission", () => {
  beforeEach(() => {
    setStoredAccessToken(createAccessToken());
  });

  afterEach(() => {
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

    act(() => {
      result.current.selectAnswer(101, "A");
    });

    await waitFor(() => expect(submittedKeys).toEqual(["A"]));

    act(() => {
      result.current.selectAnswer(101, "B");
    });

    expect(getSelectedKey(queryClient)).toBe("B");
    expect(result.current.isQuestionPending(101)).toBe(true);
    expect(submittedKeys).toEqual(["A"]);

    firstResponse.resolve();
    await waitFor(() => expect(submittedKeys).toEqual(["A", "B"]));

    expect(result.current.isQuestionPending(101)).toBe(true);

    secondResponse.resolve();
    await waitFor(() => expect(result.current.isQuestionPending(101)).toBe(false));

    expect(persistedKey).toBe("B");
    expect(getSelectedKey(queryClient)).toBe("B");
    expect(result.current.hasSyncFailures).toBe(false);
  });

  it("blocks finish after a failed answer and succeeds after retry", async () => {
    let answerShouldFail = true;
    let answerRequestCount = 0;
    let finishRequestCount = 0;
    const finishedRun = createRunResult({
      completedAt: "2026-07-14T00:00:00.000Z",
      correctCount: 1,
    });

    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return answerShouldFail
          ? HttpResponse.json({ message: "Save failed." }, { status: 500 })
          : HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => HttpResponse.json(finishedRun)),
    );

    const { result } = renderSubmission();

    act(() => {
      result.current.selectAnswer(101, "A");
    });

    await waitFor(() => expect(result.current.hasSyncFailures).toBe(true));

    await act(async () => {
      await result.current.finishRun();
    });

    expect(finishRequestCount).toBe(0);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    expect(result.current.finishError).toBe(
      "Some answers could not be saved. Retry them before finishing.",
    );
    expect(result.current.isFinishing).toBe(false);

    answerShouldFail = false;
    act(() => {
      result.current.retryFailedAnswers();
    });

    await waitFor(() => expect(result.current.hasSyncFailures).toBe(false));
    await waitFor(() => expect(result.current.isQuestionPending(101)).toBe(false));
    expect(answerRequestCount).toBe(2);

    await act(async () => {
      await result.current.finishRun();
    });

    expect(finishRequestCount).toBe(1);
    expect(result.current.isResultOpen).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("does not create a finish command while an answer is pending", async () => {
    const answerResponse = Promise.withResolvers<void>();
    let answerRequestCount = 0;
    let finishRequestCount = 0;

    mswServer.use(
      http.post(ANSWER_URL, async () => {
        answerRequestCount += 1;
        await answerResponse.promise;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json(createRunResult({
          completedAt: "2026-07-14T00:00:00.000Z",
        }));
      }),
    );

    const { result } = renderSubmission();

    act(() => {
      result.current.selectAnswer(101, "A");
    });
    await waitFor(() => expect(answerRequestCount).toBe(1));

    let pendingFinish!: Promise<void>;
    act(() => {
      pendingFinish = result.current.finishRun();
    });

    expect(finishRequestCount).toBe(0);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();

    answerResponse.resolve();
    await act(async () => {
      await pendingFinish;
    });
    await waitFor(() => expect(result.current.hasPendingAnswers).toBe(false));
    expect(finishRequestCount).toBe(0);
    expect(result.current.finishError).toBe(
      "Wait for all answers to finish saving before finishing.",
    );
  });

  it("keeps post-Finish edits local, dedupes Finish, and replaces them with the canonical GET", async () => {
    const finishResponse = Promise.withResolvers<void>();
    let answerRequestCount = 0;
    let finishRequestCount = 0;
    let getRequestCount = 0;
    const finishedRun = createRunResult({
      completedAt: "2026-07-14T00:00:00.000Z",
      wrongCount: 1,
      groups: [
        {
          ...createRunResult().groups[0]!,
          groupStatus: "wrong",
          questions: [
            {
              ...createRunResult().groups[0]!.questions[0]!,
              answerKey: "B",
              selectedKey: "A",
              status: "wrong",
              isCorrect: false,
            },
          ],
        },
      ],
    });

    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, async () => {
        finishRequestCount += 1;
        await finishResponse.promise;
        return HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(finishedRun);
      }),
    );

    const onFinishCompleted = vi.fn();
    const { result, queryClient } = renderSubmission({ onFinishCompleted });

    act(() => {
      result.current.selectAnswer(101, "A");
    });
    await waitFor(() => expect(result.current.hasPendingAnswers).toBe(false));

    let firstFinish!: Promise<void>;
    let secondFinish!: Promise<void>;
    act(() => {
      firstFinish = result.current.finishRun();
      secondFinish = result.current.finishRun();
      result.current.selectAnswer(101, "B");
    });

    expect(firstFinish).toBe(secondFinish);
    expect(getSelectedKey(queryClient)).toBe("B");
    expect(answerRequestCount).toBe(1);
    await waitFor(() => expect(finishRequestCount).toBe(1));
    expect(readMockFinishCommand(SESSION_ID)).toEqual({
      type: "finish_mock",
      sessionId: SESSION_ID,
    });

    finishResponse.resolve();
    await act(async () => {
      await firstFinish;
    });

    expect(getRequestCount).toBe(1);
    expect(getSelectedKey(queryClient)).toBe("A");
    expect(result.current.isFinishing).toBe(false);
    expect(result.current.isResultOpen).toBe(true);
    expect(finishRequestCount).toBe(1);
    expect(onFinishCompleted).toHaveBeenCalledTimes(1);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("keeps a failed Finish command and retries it without sending local edits", async () => {
    let answerRequestCount = 0;
    let finishRequestCount = 0;
    let getRequestCount = 0;
    const finishedRun = createRunResult({
      completedAt: "2026-07-14T00:00:00.000Z",
      correctCount: 1,
      groups: [
        {
          ...createRunResult().groups[0]!,
          groupStatus: "right",
          questions: [
            {
              ...createRunResult().groups[0]!.questions[0]!,
              answerKey: "A",
              selectedKey: "A",
              status: "right",
              isCorrect: true,
            },
          ],
        },
      ],
    });

    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return finishRequestCount === 1
          ? HttpResponse.json({ message: "Finish failed." }, { status: 500 })
          : HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(finishedRun);
      }),
    );

    const { result, queryClient } = renderSubmission();

    act(() => {
      result.current.selectAnswer(101, "A");
    });
    await waitFor(() => expect(result.current.hasPendingAnswers).toBe(false));

    await act(async () => {
      await result.current.finishRun();
    });

    expect(result.current.isFinishFailureOpen).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();
    expect(getRequestCount).toBe(0);

    act(() => {
      result.current.closeFinishFailure();
      result.current.selectAnswer(101, "B");
    });

    expect(getSelectedKey(queryClient)).toBe("B");
    expect(answerRequestCount).toBe(1);

    await act(async () => {
      await result.current.finishRun();
    });

    expect(finishRequestCount).toBe(2);
    expect(getRequestCount).toBe(1);
    expect(getSelectedKey(queryClient)).toBe("A");
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("keeps the Finish command when the canonical GET fails", async () => {
    let answerRequestCount = 0;
    let finishRequestCount = 0;
    let getRequestCount = 0;
    const finishedRun = createRunResult({
      completedAt: "2026-07-14T00:00:00.000Z",
      groups: [
        {
          ...createRunResult().groups[0]!,
          groupStatus: "right",
          questions: [
            {
              ...createRunResult().groups[0]!.questions[0]!,
              answerKey: "A",
              selectedKey: "A",
              status: "right",
              isCorrect: true,
            },
          ],
        },
      ],
    });

    mswServer.use(
      http.post(ANSWER_URL, () => {
        answerRequestCount += 1;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return getRequestCount === 1
          ? HttpResponse.json({ message: "Load failed." }, { status: 500 })
          : HttpResponse.json(finishedRun);
      }),
    );

    const { result, queryClient } = renderSubmission();

    await act(async () => {
      await result.current.finishRun();
    });

    expect(finishRequestCount).toBe(1);
    expect(getRequestCount).toBe(1);
    expect(result.current.isFinishFailureOpen).toBe(true);
    expect(readMockFinishCommand(SESSION_ID)).not.toBeNull();

    act(() => {
      result.current.selectAnswer(101, "B");
    });

    expect(getSelectedKey(queryClient)).toBe("B");
    expect(answerRequestCount).toBe(0);

    await act(async () => {
      await result.current.finishRun();
    });

    expect(finishRequestCount).toBe(2);
    expect(getRequestCount).toBe(2);
    expect(getSelectedKey(queryClient)).toBe("A");
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });

  it("waits for authentication before recovering a Finish command", async () => {
    let finishRequestCount = 0;
    let getRequestCount = 0;
    storeMockFinishCommand(SESSION_ID);

    mswServer.use(
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(
          createRunResult({ completedAt: "2026-07-14T00:00:00.000Z" }),
        );
      }),
    );

    const queryClient = createTestQueryClient();
    const { result, rerender } = renderHook(
      ({ isAuthenticated }) =>
        useMockRunSubmission({
          isAuthenticated,
          isFinished: false,
          queryKey: QUERY_KEY,
          selectedParts: [5],
          sessionId: SESSION_ID,
          shouldRecoverFinish: true,
        }),
      {
        initialProps: { isAuthenticated: false },
        wrapper: createQueryClientWrapper(queryClient),
      },
    );

    expect(finishRequestCount).toBe(0);
    expect(getRequestCount).toBe(0);

    rerender({ isAuthenticated: true });

    await waitFor(() => expect(result.current.isResultOpen).toBe(true));
    expect(finishRequestCount).toBe(1);
    expect(getRequestCount).toBe(1);
  });

  it("recovers an existing Finish command without creating answer requests", async () => {
    let finishRequestCount = 0;
    let getRequestCount = 0;
    const finishedRun = createRunResult({
      completedAt: "2026-07-14T00:00:00.000Z",
    });
    storeMockFinishCommand(SESSION_ID);

    mswServer.use(
      http.patch(FINISH_URL, () => {
        finishRequestCount += 1;
        return HttpResponse.json({ finished: true });
      }),
      http.get(RUN_URL, () => {
        getRequestCount += 1;
        return HttpResponse.json(finishedRun);
      }),
    );

    const { result } = renderSubmission({ shouldRecoverFinish: true });

    await waitFor(() => expect(result.current.isResultOpen).toBe(true));

    expect(finishRequestCount).toBe(1);
    expect(getRequestCount).toBe(1);
    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });
});

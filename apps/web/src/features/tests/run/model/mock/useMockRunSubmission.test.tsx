import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ToeicRunResult } from "@/entities/toeic/api/types";
import {
  clearStoredAccessToken,
  setStoredAccessToken,
} from "@/entities/session/model/accessTokenStore";
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

function renderSubmission() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(QUERY_KEY, createRunResult());

  const rendered = renderHook(
    () =>
      useMockRunSubmission({
        isAuthenticated: true,
        isFinished: false,
        queryKey: QUERY_KEY,
        sessionId: SESSION_ID,
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
        return HttpResponse.json(finishedRun);
      }),
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
  });

  it("waits for pending answers, locks new selections, and dedupes finish", async () => {
    const answerResponse = Promise.withResolvers<void>();
    const finishResponse = Promise.withResolvers<void>();
    let answerRequestCount = 0;
    let finishRequestCount = 0;
    const finishedRun = createRunResult({
      completedAt: "2026-07-14T00:00:00.000Z",
      wrongCount: 1,
    });

    mswServer.use(
      http.post(ANSWER_URL, async () => {
        answerRequestCount += 1;
        await answerResponse.promise;
        return HttpResponse.json({ graded: false });
      }),
      http.patch(FINISH_URL, async () => {
        finishRequestCount += 1;
        await finishResponse.promise;
        return HttpResponse.json(finishedRun);
      }),
    );

    const { result, queryClient } = renderSubmission();

    act(() => {
      result.current.selectAnswer(101, "A");
    });
    await waitFor(() => expect(answerRequestCount).toBe(1));

    let firstFinish!: Promise<void>;
    let secondFinish!: Promise<void>;
    act(() => {
      firstFinish = result.current.finishRun();
      secondFinish = result.current.finishRun();
      result.current.selectAnswer(101, "B");
    });

    expect(firstFinish).toBe(secondFinish);
    expect(result.current.isFinishing).toBe(true);
    expect(getSelectedKey(queryClient)).toBe("A");
    expect(finishRequestCount).toBe(0);

    answerResponse.resolve();
    await waitFor(() => expect(finishRequestCount).toBe(1));
    expect(answerRequestCount).toBe(1);

    finishResponse.resolve();
    await act(async () => {
      await firstFinish;
    });

    expect(result.current.isFinishing).toBe(false);
    expect(result.current.isResultOpen).toBe(true);
    expect(finishRequestCount).toBe(1);
  });
});

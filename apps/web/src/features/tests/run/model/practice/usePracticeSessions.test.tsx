import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ToeicQuestion,
  ToeicQuestionGroup,
} from "@/entities/toeic-runtime/model/presentation";
import {
  clearStoredAccessToken,
  setStoredAccessToken,
} from "@/entities/session/model/accessTokenStore";
import { usePartPracticeSession } from "@/features/tests/run/model/practice/usePartPracticeSession";
import { usePracticeSession } from "@/features/tests/run/model/practice/usePracticeSession";
import type { RuntimePartPracticeSession } from "@/entities/toeic-runtime/model/materializePartPracticeSession";
import type { RuntimeTestSession } from "@/entities/toeic-runtime/model/materializeTestSession";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";
import { mswServer } from "@/shared/lib/testing/mswServer";

const queryMocks = vi.hoisted(() => ({
  useRuntimePartPracticeSessionQuery: vi.fn(),
  useRuntimeTestSessionQuery: vi.fn(),
}));

vi.mock("@/entities/toeic-runtime/model/useRuntimeTestSessionQuery", () => ({
  useRuntimeTestSessionQuery: queryMocks.useRuntimeTestSessionQuery,
}));

vi.mock("@/entities/toeic-runtime/model/useRuntimePartPracticeSessionQuery", () => ({
  useRuntimePartPracticeSessionQuery:
    queryMocks.useRuntimePartPracticeSessionQuery,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: () => true,
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-id" },
  }),
}));

const SESSION_ID = "00000000-0000-4000-8000-000000000002";
const PRACTICE_QUERY_KEY = ["runtime-test-session", SESSION_ID, "practice"];
const PART_QUERY_KEY = ["part-practice-session", SESSION_ID, "practice"];
const PRACTICE_ANSWER_URL =
  `http://localhost:3001/tests/runtime/runs/${SESSION_ID}/answers`;
const PART_ANSWER_URL = `http://localhost:3001/tests/runtime/runs/${SESSION_ID}/answers`;

function createAccessToken() {
  const encode = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${encode("{}")}.${encode(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  )}.signature`;
}

function createQuestion(): ToeicQuestion {
  return {
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
  };
}

function createGroup(): ToeicQuestionGroup {
  return {
    id: 11,
    partNumber: 3,
    questionStart: 1,
    questionEnd: 1,
    groupStatus: null,
    groupType: null,
    accent: null,
    content: "Listen and answer.",
    contentVi: null,
    audioUrl: null,
    audioUrlExpiresAt: null,
    imageUrl: null,
    imageUrlExpiresAt: null,
    questions: [createQuestion()],
  };
}

function createPracticeRun(): RuntimeTestSession {
  return {
    sessionId: SESSION_ID,
    testKey: "ets26-t01",
    series: "ets_26",
    mode: "practice",
    year: 2026,
    partNumbers: [3],
    totalQuestions: 1,
    correctCount: 0,
    wrongCount: 0,
    timer: null,
    finishStatus: "open",
    isFinished: false,
    groups: [createGroup()],
    questionKeyById: new Map([[101, "ets26-t01-p3-q001"]]),
    groupKeyById: new Map([[11, "ets26-t01-p3-g001"]]),
  };
}

function createPartPracticeRun(): RuntimePartPracticeSession {
  return {
    sessionId: SESSION_ID,
    mode: "practice",
    partNumber: 3,
    totalQuestions: 1,
    correctCount: 0,
    wrongCount: 0,
    groups: [
      {
        ...createGroup(),
        testId: 1,
        year: 2026,
        testNumber: 1,
      },
    ],
    questionKeyById: new Map([[101, "ets26-t01-p3-q001"]]),
    groupKeyById: new Map([[11, "ets26-t01-p3-g001"]]),
  };
}

describe("practice session submission adapters", () => {
  beforeEach(() => {
    setStoredAccessToken(createAccessToken());
  });

  afterEach(() => {
    clearStoredAccessToken();
    vi.restoreAllMocks();
  });

  it.each(["practice", "review_wrong"] as const)(
    "submits regular %s answers without refetching the current session",
    async (mode) => {
      const session = createPracticeRun();
      const queryClient = createTestQueryClient();
      const refetch = vi.fn();
      queryClient.setQueryData(PRACTICE_QUERY_KEY, session);
      queryMocks.useRuntimeTestSessionQuery.mockReturnValue({
        data: session,
        error: null,
        isLoading: false,
        queryKey: PRACTICE_QUERY_KEY,
        refetch,
      });
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
      let submittedBody: unknown;

      mswServer.use(
        http.post(PRACTICE_ANSWER_URL, async ({ request }) => {
          submittedBody = await request.json();
          return HttpResponse.json({
            graded: true,
            isCorrect: false,
            answerKey: "A",
            correctOptionEn: "Alpha",
            correctOptionVi: null,
          });
        }),
      );

      const { result } = renderHook(
        () =>
          usePracticeSession({
            enabled: true,
            mode,
            sessionId: SESSION_ID,
            selectedParts: [3],
          }),
        { wrapper: createQueryClientWrapper(queryClient) },
      );

      act(() => {
        result.current.selectAnswer(101, "B", { deferGrade: true });
      });

      await waitFor(() => expect(result.current.isSubmitting).toBe(false));

      expect(submittedBody).toEqual({
        ...(mode === "review_wrong" ? { mode } : {}),
        questionKey: "ets26-t01-p3-q001",
        selectedKey: "B",
      });
      expect(refetch).not.toHaveBeenCalled();
      expect(invalidateQueries).toHaveBeenCalledTimes(1);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["runtime-test-practice-overview", { userId: "user-id" }],
      });
      expect(
        queryClient.getQueryData<RuntimeTestSession>(PRACTICE_QUERY_KEY)?.groups[0]
          ?.questions[0],
      ).toMatchObject({ selectedKey: "B", status: "selected" });
    },
  );

  it.each(["practice", "review_wrong"] as const)(
    "submits part %s answers without refetching the current session",
    async (mode) => {
      const session = createPartPracticeRun();
      const queryClient = createTestQueryClient();
      const refetch = vi.fn();
      queryClient.setQueryData(PART_QUERY_KEY, session);
      queryMocks.useRuntimePartPracticeSessionQuery.mockReturnValue({
        data: session,
        error: null,
        isLoading: false,
        queryKey: PART_QUERY_KEY,
        refetch,
        userId: "user-id",
      });
      const refetchQueries = vi.spyOn(queryClient, "refetchQueries");
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
      let submittedBody: unknown;

      mswServer.use(
        http.post(PART_ANSWER_URL, async ({ request }) => {
          submittedBody = await request.json();
          return HttpResponse.json({
            graded: true,
          });
        }),
      );

      const { result } = renderHook(
        () =>
          usePartPracticeSession({
            enabled: true,
            mode,
            sessionId: SESSION_ID,
          }),
        { wrapper: createQueryClientWrapper(queryClient) },
      );

      act(() => {
        result.current.selectAnswer(101, "A", { deferGrade: true });
      });

      await waitFor(() => expect(result.current.isSubmitting).toBe(false));

      expect(submittedBody).toEqual({
        questionKey: "ets26-t01-p3-q001",
        selectedKey: "A",
        ...(mode === "review_wrong" ? { mode } : {}),
      });
      expect(refetchQueries).not.toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
      expect(invalidateQueries).toHaveBeenCalledTimes(1);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["part-practice-overview", { userId: "user-id" }],
        refetchType: "none",
      });
    },
  );
});

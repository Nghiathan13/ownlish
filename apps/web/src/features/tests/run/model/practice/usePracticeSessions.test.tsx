import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PartPracticeSessionResult,
  ToeicQuestion,
  ToeicQuestionGroup,
  ToeicRunResult,
} from "@/entities/toeic/api/types";
import {
  clearStoredAccessToken,
  setStoredAccessToken,
} from "@/entities/session/model/accessTokenStore";
import { usePartPracticeSession } from "@/features/tests/run/model/practice/usePartPracticeSession";
import { usePracticeSession } from "@/features/tests/run/model/practice/usePracticeSession";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";
import { mswServer } from "@/shared/lib/testing/mswServer";

const queryMocks = vi.hoisted(() => ({
  usePartPracticeRunQuery: vi.fn(),
  usePracticeRunQuery: vi.fn(),
}));

vi.mock("@/entities/toeic/hooks/usePracticeRunQuery", () => ({
  usePracticeRunQuery: queryMocks.usePracticeRunQuery,
}));

vi.mock("@/entities/toeic/hooks/usePartPracticeRunQuery", () => ({
  usePartPracticeRunQuery: queryMocks.usePartPracticeRunQuery,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: () => true,
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-id" },
  }),
}));

const SESSION_ID = "00000000-0000-4000-8000-000000000002";
const PRACTICE_QUERY_KEY = ["practice-session", SESSION_ID, "3", "practice"];
const PART_QUERY_KEY = ["part-practice-session", SESSION_ID, "practice"];
const PRACTICE_ANSWER_URL =
  `http://localhost:3001/tests/runs/${SESSION_ID}/answers`;
const PART_ANSWER_URL =
  `http://localhost:3001/tests/part-practice/runs/${SESSION_ID}/answers`;

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

function createPracticeRun(): ToeicRunResult {
  return {
    sessionId: SESSION_ID,
    mode: "practice",
    testId: 1,
    year: 2026,
    partNumbers: [3],
    totalQuestions: 1,
    correctCount: 0,
    wrongCount: 0,
    completedAt: null,
    groups: [createGroup()],
  };
}

function createPartPracticeRun(): PartPracticeSessionResult {
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
      queryMocks.usePracticeRunQuery.mockReturnValue({
        data: session,
        error: null,
        isLoading: false,
        queryKey: PRACTICE_QUERY_KEY,
        refetch,
      });
      const refetchQueries = vi.spyOn(queryClient, "refetchQueries");
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
            selectedParts: [3],
            sessionId: SESSION_ID,
          }),
        { wrapper: createQueryClientWrapper(queryClient) },
      );

      act(() => {
        result.current.selectAnswer(101, "B", { deferGrade: true });
      });

      await waitFor(() => expect(result.current.isSubmitting).toBe(false));

      expect(submittedBody).toEqual({
        mode,
        selectedKey: "B",
        toeicQuestionId: 101,
      });
      expect(refetchQueries).not.toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
      expect(invalidateQueries).toHaveBeenCalledTimes(1);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["tests"],
        refetchType: "none",
      });
      expect(
        queryClient.getQueryData<ToeicRunResult>(PRACTICE_QUERY_KEY)?.groups[0]
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
      queryMocks.usePartPracticeRunQuery.mockReturnValue({
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
            isCorrect: true,
            answerKey: "A",
            correctOptionEn: "Alpha",
            correctOptionVi: null,
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
        mode,
        selectedKey: "A",
        toeicQuestionId: 101,
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

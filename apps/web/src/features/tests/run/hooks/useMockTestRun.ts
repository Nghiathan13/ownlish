"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getToeicRun } from "@/features/tests/run/api/getToeicRun";
import { finishToeicRun } from "@/features/tests/run/api/finishToeicRun";
import { submitToeicAnswer } from "@/features/tests/run/api/submitToeicAnswer";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import type {
  PracticeSessionResult,
  ToeicQuestion,
} from "@/features/tests/shared/api/types";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

export function getToeicRunQueryKey(sessionId: string) {
  return ["toeic-run", sessionId] as const;
}

function updateQuestionSelection(
  current: PracticeSessionResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): PracticeSessionResult {
  return {
    ...current,
    groups: current.groups.map((group) => ({
      ...group,
      questions: group.questions.map((question) => {
        if (question.id !== toeicQuestionId) {
          return question;
        }

        return {
          ...question,
          selectedKey,
          status: "selected",
          isCorrect: null,
        };
      }),
    })),
  };
}

function toAnswerMap(groups: PracticeSessionResult["groups"]) {
  return new Map(
    groups.flatMap((group) =>
      group.questions.map((question) => [question.id, question] as const),
    ),
  );
}

type UseMockTestRunParams = {
  sessionId: string;
};

export function useMockTestRun({ sessionId }: UseMockTestRunParams) {
  const { accessToken, clearSession } = useAuthSession();
  const queryClient = useQueryClient();
  const queryKey = getToeicRunQueryKey(sessionId);
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const pendingSubmitRequestsRef = useRef(new Set<Promise<unknown>>());

  const runQuery = useQuery({
    queryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => getToeicRun(token, sessionId),
      }),
    enabled: Boolean(accessToken && sessionId),
    staleTime: Infinity,
    refetchOnMount: false,
    retry: false,
  });

  const sessionData = runQuery.data;
  const answersByQuestionId = useMemo(
    () => toAnswerMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );
  const isFinished = Boolean(sessionData?.completedAt);

  const getAnswer = useCallback(
    (toeicQuestionId: number): ToeicQuestion | undefined =>
      answersByQuestionId.get(toeicQuestionId),
    [answersByQuestionId],
  );

  const selectAnswer = useCallback(
    (toeicQuestionId: number, selectedKey: OptionKey) => {
      if (!accessToken || isFinished) {
        return;
      }

      queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return updateQuestionSelection(current, toeicQuestionId, selectedKey);
      });

      setPendingQuestionIds((current) => new Set(current).add(toeicQuestionId));

      const submitRequest = runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          submitToeicAnswer(token, sessionId, {
            toeicQuestionId,
            selectedKey,
          }),
      })
        .then(() => {
          setPendingQuestionIds((current) => {
            const next = new Set(current);
            next.delete(toeicQuestionId);
            return next;
          });
        })
        .catch(() => {
          setPendingQuestionIds((current) => {
            const next = new Set(current);
            next.delete(toeicQuestionId);
            return next;
          });
        })
        .finally(() => {
          pendingSubmitRequestsRef.current.delete(submitRequest);
        });

      pendingSubmitRequestsRef.current.add(submitRequest);
    },
    [accessToken, clearSession, isFinished, queryClient, queryKey, sessionId],
  );

  const finishRun = useCallback(async () => {
    if (!accessToken || !sessionId) {
      return;
    }

    setFinishError(null);
    try {
      await Promise.allSettled(pendingSubmitRequestsRef.current);
      const result = await runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => finishToeicRun(token, sessionId),
      });
      queryClient.setQueryData(queryKey, result);
      await queryClient.invalidateQueries({ queryKey: ["tests"] });
      setIsResultOpen(true);
    } catch (error) {
      setFinishError(
        error instanceof Error ? error.message : "Cannot finish mock test.",
      );
    }
  }, [accessToken, clearSession, queryClient, queryKey, sessionId]);

  return {
    correctCount: sessionData?.correctCount ?? 0,
    wrongCount: sessionData?.wrongCount ?? 0,
    groups: sessionData?.groups ?? [],
    getAnswer,
    isFinished,
    isLoading: runQuery.isLoading,
    loadError: runQuery.error
      ? runQuery.error instanceof Error
        ? runQuery.error.message
        : "Cannot load mock test."
      : null,
    finishError,
    finishRun,
    isQuestionPending: (toeicQuestionId: number) =>
      pendingQuestionIds.has(toeicQuestionId),
    isResultOpen,
    closeResult: () => setIsResultOpen(false),
    selectAnswer,
    sessionData,
  };
}

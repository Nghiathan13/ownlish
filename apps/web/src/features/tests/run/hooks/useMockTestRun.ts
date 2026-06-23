"use client";

import { useCallback, useMemo } from "react";
import { getToeicRunQueryKey } from "@/entities/toeic/lib/toeicCache";
import { toAnswerMap } from "@/entities/toeic/lib/runState";
import { useMockRunQuery } from "@/entities/toeic/hooks/useMockRunQuery";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { useFinishMockRun } from "./useFinishMockRun";
import { useMockAnswerSync } from "./useMockAnswerSync";

export { getToeicRunQueryKey };

type UseMockTestRunParams = {
  sessionId: string;
  selectedParts?: number[];
};

export function useMockTestRun({
  sessionId,
  selectedParts,
}: UseMockTestRunParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);

  const runQuery = useMockRunQuery({ sessionId, selectedParts });
  const sessionData = runQuery.data;
  const isFinished = Boolean(sessionData?.completedAt);

  const answersByQuestionId = useMemo(
    () => toAnswerMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );

  const answerSync = useMockAnswerSync({
    sessionId,
    queryKey: runQuery.queryKey,
    isAuthenticated,
    isFinished,
  });

  const finish = useFinishMockRun({
    sessionId,
    queryKey: runQuery.queryKey,
    isAuthenticated,
    waitForPendingSubmissions: answerSync.waitForPendingSubmissions,
  });

  const getAnswer = useCallback(
    (toeicQuestionId: number): ToeicQuestion | undefined =>
      answersByQuestionId.get(toeicQuestionId),
    [answersByQuestionId],
  );

  return {
    correctCount: sessionData?.correctCount ?? 0,
    wrongCount: sessionData?.wrongCount ?? 0,
    groups: sessionData?.groups ?? [],
    testId: sessionData?.testId ?? null,
    year: sessionData?.year ?? null,
    totalQuestions: sessionData?.totalQuestions ?? 0,
    getAnswer,
    isFinished,
    isLoading: runQuery.isLoading,
    loadError: runQuery.error,
    finishError: finish.finishError,
    finishRun: finish.finishRun,
    isQuestionPending: answerSync.isQuestionPending,
    isResultOpen: finish.isResultOpen,
    closeResult: finish.closeResult,
    selectAnswer: answerSync.selectAnswer,
    sessionData,
  };
}

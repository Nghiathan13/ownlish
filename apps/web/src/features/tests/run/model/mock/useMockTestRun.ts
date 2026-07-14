"use client";

import { useCallback, useMemo } from "react";
import { getToeicRunQueryKey } from "@/entities/toeic/lib/toeicCache";
import { toAnswerMap } from "@/entities/toeic/lib/runState";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { useMockRunQuery } from "@/features/tests/run/model/mock/useMockRunQuery";
import { useMockRunSubmission } from "@/features/tests/run/model/mock/useMockRunSubmission";

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

  const submission = useMockRunSubmission({
    sessionId,
    queryKey: runQuery.queryKey,
    isAuthenticated,
    isFinished,
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
    finishError: submission.finishError,
    finishRun: submission.finishRun,
    hasSyncFailures: submission.hasSyncFailures,
    isFinishing: submission.isFinishing,
    isQuestionPending: submission.isQuestionPending,
    isResultOpen: submission.isResultOpen,
    closeResult: submission.closeResult,
    retryFailedAnswers: submission.retryFailedAnswers,
    selectAnswer: submission.selectAnswer,
    sessionData,
  };
}

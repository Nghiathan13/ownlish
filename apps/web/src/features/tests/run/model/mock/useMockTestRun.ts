"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toAnswerMap } from "@/entities/toeic/lib/runState";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { useMockRunQuery } from "@/features/tests/run/model/mock/useMockRunQuery";
import { useMockRunSubmission } from "@/features/tests/run/model/mock/useMockRunSubmission";
import { readMockFinishCommand } from "@/features/tests/run/model/mock/mockFinishOutbox";

type UseMockTestRunParams = {
  sessionId: string;
};

type FinishBootstrapState = {
  sessionId: string;
  status: "checking" | "pending" | "ready";
};

export function useMockTestRun({
  sessionId,
}: UseMockTestRunParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [finishBootstrap, setFinishBootstrap] =
    useState<FinishBootstrapState>({
      sessionId,
      status: "checking",
    });
  const finishBootstrapStatus =
    finishBootstrap.sessionId === sessionId
      ? finishBootstrap.status
      : "checking";

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      setFinishBootstrap({
        sessionId,
        status: readMockFinishCommand(sessionId) ? "pending" : "ready",
      });
    });

    return () => {
      isActive = false;
    };
  }, [sessionId]);

  const runQuery = useMockRunQuery({
    sessionId,
    enabled: finishBootstrapStatus === "ready",
  });
  const sessionData = runQuery.data;
  const isFinished = Boolean(sessionData?.isFinished);

  const handleFinishCompleted = useCallback(() => {
    setFinishBootstrap({ sessionId, status: "ready" });
  }, [sessionId]);

  const answersByQuestionId = useMemo(
    () => toAnswerMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );

  const submission = useMockRunSubmission({
    sessionId,
    queryKey: runQuery.queryKey,
    questionKeyById: sessionData?.questionKeyById,
    isAuthenticated,
    isFinished,
    onFinishCompleted: handleFinishCompleted,
    shouldRecoverFinish: finishBootstrapStatus === "pending",
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
    series: sessionData?.series ?? null,
    testNumber: sessionData?.testNumber ?? null,
    year: sessionData?.year ?? null,
    totalQuestions: sessionData?.totalQuestions ?? 0,
    getAnswer,
    isFinished,
    isLoading:
      finishBootstrapStatus !== "ready" ||
      runQuery.isLoading ||
      runQuery.isFetching,
    loadError: runQuery.error,
    finishError: submission.finishError,
    finishRun: submission.finishRun,
    hasPendingAnswers: submission.hasPendingAnswers,
    hasSyncFailures: submission.hasSyncFailures,
    isFinishAccepted: submission.isFinishAccepted,
    isFinishFailureOpen: submission.isFinishFailureOpen,
    isFinishing: submission.isFinishing,
    isQuestionPending: submission.isQuestionPending,
    isResultOpen: submission.isResultOpen,
    closeResult: submission.closeResult,
    closeFinishFailure: submission.closeFinishFailure,
    retryFailedAnswers: submission.retryFailedAnswers,
    selectAnswer: submission.selectAnswer,
    sessionData,
  };
}

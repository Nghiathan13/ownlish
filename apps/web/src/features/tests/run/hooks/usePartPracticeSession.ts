"use client";

import { useCallback, useMemo } from "react";
import { getPartPracticeSessionQueryKey } from "@/entities/toeic/lib/toeicCache";
import { toAnswerMap } from "@/entities/toeic/lib/runState";
import { usePartPracticeRunQuery } from "@/entities/toeic/hooks/usePartPracticeRunQuery";
import type {
  PracticeMode,
  SubmitAnswerResult,
} from "@/entities/toeic/api/types";
import {
  buildAnswerKeyMap,
  type OptionKey,
} from "@/features/tests/run/lib/answerKeyMap";
import { isPracticeAnswerGraded } from "@/features/tests/run/lib/practiceAnswers";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { usePracticeLocalGrade } from "./usePracticeLocalGrade";
import { usePartPracticeAnswerSync } from "./usePartPracticeAnswerSync";

export { getPartPracticeSessionQueryKey };

type UsePartPracticeSessionParams = {
  sessionId: string;
  mode?: PracticeMode;
  enabled: boolean;
};

type SelectAnswerOptions = {
  replace?: boolean;
  deferGrade?: boolean;
  skipLocalGrade?: boolean;
};

export function usePartPracticeSession({
  sessionId,
  mode = "practice",
  enabled,
}: UsePartPracticeSessionParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);

  const runQuery = usePartPracticeRunQuery({
    sessionId,
    mode,
    enabled,
  });

  const sessionData = runQuery.data;
  const answerKeyMap = useMemo(
    () => buildAnswerKeyMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );

  const answersByQuestionId = useMemo(
    () => toAnswerMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );

  const { gradeLocally, gradeGroupLocally, rollbackGroupGrade } =
    usePracticeLocalGrade({
      queryKey: runQuery.queryKey,
      answerKeyMap,
    });

  const answerSync = usePartPracticeAnswerSync({
    sessionId,
    mode,
    queryKey: runQuery.queryKey,
    userId: runQuery.userId,
    isAuthenticated,
    answersByQuestionId,
  });

  const getAnswer = useCallback(
    (toeicQuestionId: number) => answersByQuestionId.get(toeicQuestionId),
    [answersByQuestionId],
  );

  const selectAnswer = useCallback(
    (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: SelectAnswerOptions,
    ) => {
      const existingAnswer = answersByQuestionId.get(toeicQuestionId);
      if (
        existingAnswer &&
        isPracticeAnswerGraded(existingAnswer) &&
        !options?.replace
      ) {
        return;
      }

      if (existingAnswer?.selectedKey === selectedKey) {
        return;
      }

      if (!options?.skipLocalGrade) {
        gradeLocally(toeicQuestionId, selectedKey, {
          deferGrade: options?.deferGrade,
        });
      }

      void answerSync.syncAnswerToServer(toeicQuestionId, selectedKey, {
        replace: options?.replace,
      });
    },
    [answersByQuestionId, answerSync, gradeLocally],
  );

  const submitAnswer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: { replace?: boolean },
    ): Promise<SubmitAnswerResult | null> => {
      selectAnswer(toeicQuestionId, selectedKey, options);
      return null;
    },
    [selectAnswer],
  );

  return {
    sessionId,
    partNumber: sessionData?.partNumber ?? 0,
    groups: sessionData?.groups ?? [],
    totalQuestions: sessionData?.totalQuestions ?? 0,
    getAnswer,
    isStarting: runQuery.isLoading,
    startError: runQuery.error,
    isSubmitting: answerSync.isSubmitting,
    isQuestionPending: answerSync.isQuestionPending,
    isQuestionSyncFailed: answerSync.isQuestionSyncFailed,
    hasSyncFailures: answerSync.hasSyncFailures,
    failedQuestionIds: answerSync.failedQuestionIds,
    selectAnswer,
    gradeGroupLocally,
    rollbackGroupGrade,
    syncAnswerToServer: answerSync.syncAnswerToServer,
    retrySync: answerSync.retrySync,
    submitAnswer,
  };
}

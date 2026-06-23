"use client";

import { useCallback, useMemo } from "react";
import { getPracticeSessionQueryKey } from "@/entities/toeic/lib/toeicCache";
import { toAnswerMap } from "@/entities/toeic/lib/runState";
import { usePracticeRunQuery } from "@/entities/toeic/hooks/usePracticeRunQuery";
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
import { usePracticeAnswerSync } from "./usePracticeAnswerSync";
import { usePracticeLocalGrade } from "./usePracticeLocalGrade";

export { getPracticeSessionQueryKey };

type UsePracticeSessionParams = {
  sessionId: string;
  selectedParts: number[];
  mode?: PracticeMode;
  enabled: boolean;
};

type SelectAnswerOptions = {
  replace?: boolean;
  deferGrade?: boolean;
  skipLocalGrade?: boolean;
};

export function usePracticeSession({
  sessionId,
  selectedParts,
  mode = "practice",
  enabled,
}: UsePracticeSessionParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);

  const runQuery = usePracticeRunQuery({
    sessionId,
    selectedParts,
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

  const answerSync = usePracticeAnswerSync({
    sessionId,
    mode,
    queryKey: runQuery.queryKey,
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
    testId: sessionData?.testId ?? null,
    year: sessionData?.year ?? null,
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

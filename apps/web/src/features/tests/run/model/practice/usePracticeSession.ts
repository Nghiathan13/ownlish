"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { submitToeicAnswer } from "@/entities/toeic/api/toeic";
import type {
  PracticeMode,
  SubmitAnswerResult,
} from "@/entities/toeic/api/types";
import { usePracticeRunQuery } from "@/entities/toeic/hooks/usePracticeRunQuery";
import { getPracticeSessionQueryKey } from "@/entities/toeic/lib/toeicCache";
import { toAnswerMap } from "@/entities/toeic/lib/runState";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import {
  buildAnswerKeyMap,
  type OptionKey,
} from "@/features/tests/run/lib/answerKeyMap";
import { isPracticeAnswerGraded } from "@/features/tests/run/lib/practiceAnswers";
import {
  type PracticeAnswerSubmission,
  usePracticeAnswerSubmission,
} from "./usePracticeAnswerSubmission";
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
  const queryClient = useQueryClient();
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

  const { gradeLocally, gradeGroupLocally } = usePracticeLocalGrade({
    queryKey: runQuery.queryKey,
    answerKeyMap,
  });

  const submit = useCallback(
    ({ toeicQuestionId, selectedKey }: PracticeAnswerSubmission) =>
      runAuthenticatedRequest({
        request: (token) =>
          submitToeicAnswer(token, sessionId, {
            toeicQuestionId,
            selectedKey,
            mode,
          }),
      }),
    [mode, sessionId],
  );

  const handleSubmissionSuccess = useCallback(
    (result: SubmitAnswerResult) => {
      if (!result.graded) {
        return;
      }

      return queryClient.invalidateQueries({
        queryKey: ["tests"],
        refetchType: "none",
      });
    },
    [queryClient],
  );

  const {
    failedQuestionIds,
    hasSyncFailures,
    isQuestionPending,
    isQuestionSyncFailed,
    isSubmitting,
    queueAnswer,
    retryFailedAnswers,
  } = usePracticeAnswerSubmission({
    submit,
    onSuccess: handleSubmissionSuccess,
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
      if (!isAuthenticated || !sessionId) {
        return;
      }

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

      queueAnswer(toeicQuestionId, selectedKey);
    },
    [
      answersByQuestionId,
      gradeLocally,
      isAuthenticated,
      queueAnswer,
      sessionId,
    ],
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
    isSubmitting,
    isQuestionPending,
    isQuestionSyncFailed,
    hasSyncFailures,
    failedQuestionIds,
    retryFailedAnswers,
    selectAnswer,
    gradeGroupLocally,
    submitAnswer,
    refetch: runQuery.refetch,
  };
}

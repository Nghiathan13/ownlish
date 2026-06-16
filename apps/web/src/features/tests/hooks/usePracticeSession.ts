"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPracticeSession,
  submitPracticeAnswer,
} from "@/features/tests/api/testsApi";
import type {
  PracticeMode,
  PracticeSessionAnswer,
  PracticeSessionResult,
  SubmitAnswerResult,
} from "@/features/tests/api/types";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

type UsePracticeSessionParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  partNumber: number;
  mode?: PracticeMode;
  enabled: boolean;
};

export function getPracticeSessionQueryKey(
  testId: number,
  partNumber: number,
  mode: PracticeMode = "normal",
) {
  return ["practice-session", testId, partNumber, mode] as const;
}

function toAnswerMap(answers: PracticeSessionAnswer[]) {
  return new Map(answers.map((answer) => [answer.toeicQuestionId, answer]));
}

export function usePracticeSession({
  accessToken,
  clearSession,
  testId,
  partNumber,
  mode = "normal",
  enabled,
}: UsePracticeSessionParams) {
  const queryClient = useQueryClient();
  const queryKey = getPracticeSessionQueryKey(testId, partNumber, mode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionQuery = useQuery({
    queryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          createPracticeSession(token, {
            testId,
            partNumber,
            mode,
          }),
      }),
    enabled: enabled && Boolean(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  const sessionData = sessionQuery.data;
  const sessionId = sessionData?.sessionId ?? null;

  const answersByQuestionId = useMemo(
    () => toAnswerMap(sessionData?.answers ?? []),
    [sessionData?.answers],
  );

  const getAnswer = useCallback(
    (toeicQuestionId: number) => answersByQuestionId.get(toeicQuestionId),
    [answersByQuestionId],
  );

  const submitAnswer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: "A" | "B" | "C" | "D",
    ): Promise<SubmitAnswerResult | null> => {
      if (!accessToken || !sessionId || answersByQuestionId.has(toeicQuestionId)) {
        return null;
      }

      setIsSubmitting(true);
      try {
        const result = await runAuthenticatedRequest({
          accessToken,
          clearSession,
          request: (token) =>
            submitPracticeAnswer(token, sessionId, {
              toeicQuestionId,
              selectedKey,
            }),
        });

        queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            correctCount: current.correctCount + (result.isCorrect ? 1 : 0),
            wrongCount: current.wrongCount + (result.isCorrect ? 0 : 1),
            answers: [
              ...current.answers,
              {
                toeicQuestionId,
                selectedKey,
                answerKey: result.answerKey,
                isCorrect: result.isCorrect,
              },
            ],
          };
        });

        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      accessToken,
      answersByQuestionId,
      clearSession,
      queryClient,
      queryKey,
      sessionId,
    ],
  );

  return {
    sessionId,
    correctCount: sessionData?.correctCount ?? 0,
    wrongCount: sessionData?.wrongCount ?? 0,
    getAnswer,
    isStarting: sessionQuery.isLoading,
    startError: sessionQuery.error
      ? sessionQuery.error instanceof Error
        ? sessionQuery.error.message
        : "Cannot start practice session."
      : null,
    isSubmitting,
    submitAnswer,
  };
}

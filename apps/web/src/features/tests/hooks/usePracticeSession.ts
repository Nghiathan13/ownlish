"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  completePracticeSession,
  createPracticeSession,
  submitPracticeAnswer,
} from "@/features/tests/api/testsApi";
import type { SubmitAnswerResult } from "@/features/tests/api/types";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

type UsePracticeSessionParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  partNumber: number;
  enabled: boolean;
};

export function getPracticeSessionQueryKey(
  testId: number,
  partNumber: number,
) {
  return ["practice-session", testId, partNumber] as const;
}

export function usePracticeSession({
  accessToken,
  clearSession,
  testId,
  partNumber,
  enabled,
}: UsePracticeSessionParams) {
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completion, setCompletion] = useState<{
    correctCount: number;
    wrongCount: number;
  } | null>(null);

  const sessionQuery = useQuery({
    queryKey: getPracticeSessionQueryKey(testId, partNumber),
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          createPracticeSession(token, {
            testId,
            partNumber,
            mode: "normal",
          }),
      }),
    enabled: enabled && Boolean(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  const sessionId = sessionQuery.data?.sessionId ?? null;

  const submitAnswer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: "A" | "B" | "C" | "D",
    ): Promise<SubmitAnswerResult | null> => {
      if (!accessToken || !sessionId) {
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

        if (result.isCorrect) {
          setCorrectCount((current) => current + 1);
        } else {
          setWrongCount((current) => current + 1);
        }

        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken, clearSession, sessionId],
  );

  const completeSession = useCallback(async () => {
    if (!accessToken || !sessionId) {
      return null;
    }

    const result = await runAuthenticatedRequest({
      accessToken,
      clearSession,
      request: (token) => completePracticeSession(token, sessionId),
    });
    setCompletion(result);
    return result;
  }, [accessToken, clearSession, sessionId]);

  return {
    sessionId,
    correctCount,
    wrongCount,
    isStarting: sessionQuery.isLoading,
    startError: sessionQuery.error ? "Cannot start practice session." : null,
    isSubmitting,
    completion,
    submitAnswer,
    completeSession,
  };
}

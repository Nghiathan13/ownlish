"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPracticeSession,
  submitPracticeAnswer,
  submitReviewGroupAnswers,
  completePracticeSession,
} from "@/features/tests/api/testsApi";
import type {
  PracticeMode,
  PracticeSessionAnswer,
  PracticeSessionResult,
  SubmitAnswerResult,
} from "@/features/tests/api/types";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
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

function usesDeferredGroupGrading(partNumber: number, mode: PracticeMode) {
  return (partNumber === 3 || partNumber === 4) && mode === "normal";
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
    staleTime: mode === "wrong_questions" ? 0 : Infinity,
    gcTime: mode === "wrong_questions" ? 0 : 5 * 60 * 1000,
    refetchOnMount: "always",
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
      options?: { replace?: boolean },
    ): Promise<SubmitAnswerResult | null> => {
      if (!accessToken || !sessionId) {
        return null;
      }

      const existingAnswer = answersByQuestionId.get(toeicQuestionId);
      if (
        existingAnswer &&
        isPracticeAnswerGraded(existingAnswer) &&
        !options?.replace
      ) {
        return null;
      }

      if (existingAnswer?.selectedKey === selectedKey) {
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

        if (!result.graded) {
          queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
            if (!current) {
              return current;
            }

            if (existingAnswer) {
              return {
                ...current,
                answers: current.answers.map((answer) =>
                  answer.toeicQuestionId === toeicQuestionId
                    ? { toeicQuestionId, selectedKey }
                    : answer,
                ),
              };
            }

            return {
              ...current,
              answers: [...current.answers, { toeicQuestionId, selectedKey }],
            };
          });

          return result;
        }

        if (usesDeferredGroupGrading(partNumber, mode)) {
          await queryClient.refetchQueries({ queryKey });
          return result;
        }

        if (mode === "wrong_questions" && result.isCorrect) {
          await queryClient.invalidateQueries({
            queryKey: getPracticeSessionQueryKey(testId, partNumber, "normal"),
          });
        }

        queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
          if (!current || result.isCorrect === undefined || !result.answerKey) {
            return current;
          }

          if (existingAnswer) {
            const wasCorrect = existingAnswer.isCorrect ?? false;
            const correctDelta = (result.isCorrect ? 1 : 0) - (wasCorrect ? 1 : 0);
            const wrongDelta =
              mode === "normal"
                ? (result.isCorrect ? 0 : 1) - (wasCorrect ? 0 : 1)
                : 0;

            return {
              ...current,
              correctCount: current.correctCount + correctDelta,
              wrongCount: current.wrongCount + wrongDelta,
              answers: current.answers.map((answer) =>
                answer.toeicQuestionId === toeicQuestionId
                  ? {
                      toeicQuestionId,
                      selectedKey,
                      answerKey: result.answerKey,
                      isCorrect: result.isCorrect,
                    }
                  : answer,
              ),
            };
          }

          return {
            ...current,
            correctCount: current.correctCount + (result.isCorrect ? 1 : 0),
            wrongCount:
              current.wrongCount +
              (mode === "normal" && !result.isCorrect ? 1 : 0),
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
      mode,
      partNumber,
      testId,
    ],
  );

  const submitReviewGroupAnswersBatch = useCallback(
    async (
      groupId: number,
      answers: Array<{
        toeicQuestionId: number;
        selectedKey: "A" | "B" | "C" | "D";
      }>,
    ) => {
      if (!accessToken || !sessionId) {
        return null;
      }

      setIsSubmitting(true);
      try {
        const result = await runAuthenticatedRequest({
          accessToken,
          clearSession,
          request: (token) =>
            submitReviewGroupAnswers(token, sessionId, groupId, { answers }),
        });

        const selectedKeyByQuestionId = new Map(
          answers.map((answer) => [answer.toeicQuestionId, answer.selectedKey]),
        );

        queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
          if (!current) {
            return current;
          }

          const answersByQuestionId = new Map(
            current.answers.map((answer) => [answer.toeicQuestionId, answer]),
          );
          let correctCount = current.correctCount;

          for (const item of result.results) {
            const existing = answersByQuestionId.get(item.toeicQuestionId);
            const wasCorrect = existing?.isCorrect === true;
            const selectedKey =
              selectedKeyByQuestionId.get(item.toeicQuestionId) ??
              existing?.selectedKey;

            if (!selectedKey || item.answerKey === undefined) {
              continue;
            }

            if (item.isCorrect && !wasCorrect) {
              correctCount += 1;
            } else if (!item.isCorrect && wasCorrect) {
              correctCount -= 1;
            }

            answersByQuestionId.set(item.toeicQuestionId, {
              toeicQuestionId: item.toeicQuestionId,
              selectedKey,
              answerKey: item.answerKey,
              isCorrect: item.isCorrect,
            });
          }

          return {
            ...current,
            correctCount,
            answers: Array.from(answersByQuestionId.values()),
          };
        });

        await queryClient.refetchQueries({ queryKey });
        await queryClient.invalidateQueries({
          queryKey: getPracticeSessionQueryKey(testId, partNumber, "normal"),
        });

        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      accessToken,
      clearSession,
      partNumber,
      queryClient,
      queryKey,
      sessionId,
      testId,
    ],
  );

  const completeSession = useCallback(async () => {
    if (!accessToken || !sessionId) {
      return null;
    }

    return runAuthenticatedRequest({
      accessToken,
      clearSession,
      request: (token) => completePracticeSession(token, sessionId),
    });
  }, [accessToken, clearSession, sessionId]);

  return {
    sessionId,
    answers: sessionData?.answers ?? [],
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
    submitReviewGroupAnswersBatch,
    completeSession,
  };
}

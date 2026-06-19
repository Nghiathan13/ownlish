"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import type { OptionKey } from "@/features/tests/lib/answerKeyMap";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { createToeicSessionRequest } from "@/features/tests/lib/createToeicSessionRequest";

type UsePracticeSessionParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  partNumber: number;
  selectedParts?: number[];
  mode?: PracticeMode;
  enabled: boolean;
  answerKeyMap?: Map<number, OptionKey>;
};

type SelectAnswerOptions = {
  replace?: boolean;
  deferGrade?: boolean;
  skipLocalGrade?: boolean;
  selectionOnly?: boolean;
};

type SyncAnswerOptions = {
  replace?: boolean;
  selectionOnly?: boolean;
};

function normalizePracticeParts(partNumber: number, selectedParts?: number[]) {
  const parts = selectedParts?.length ? selectedParts : [partNumber];
  return [...new Set(parts)].sort((a, b) => a - b);
}

function getPracticePartsKey(parts: number[]) {
  return parts.join(",");
}

export function getPracticeSessionQueryKey(
  testId: number,
  partNumberOrParts: number | number[],
  mode: PracticeMode = "practice",
) {
  const parts = Array.isArray(partNumberOrParts)
    ? normalizePracticeParts(partNumberOrParts[0] ?? 1, partNumberOrParts)
    : [partNumberOrParts];

  return ["practice-session", testId, getPracticePartsKey(parts), mode] as const;
}

function toAnswerMap(answers: PracticeSessionAnswer[]) {
  return new Map(answers.map((answer) => [answer.toeicQuestionId, answer]));
}

function usesDeferredGroupGrading(partNumber: number, mode: PracticeMode) {
  return (partNumber === 3 || partNumber === 4) && mode === "practice";
}

function applyGradedAnswer(
  current: PracticeSessionResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
  answerKey: OptionKey,
  isCorrect: boolean,
  mode: PracticeMode,
  existingAnswer?: PracticeSessionAnswer,
): PracticeSessionResult {
  const gradedAnswer: PracticeSessionAnswer = {
    toeicQuestionId,
    selectedKey,
    answerKey,
    isCorrect,
  };

  if (existingAnswer) {
    const wasCorrect = existingAnswer.isCorrect ?? false;
    const correctDelta = (isCorrect ? 1 : 0) - (wasCorrect ? 1 : 0);
    const wrongDelta =
      mode === "practice"
        ? (isCorrect ? 0 : 1) - (wasCorrect ? 0 : 1)
        : 0;

    return {
      ...current,
      correctCount: current.correctCount + correctDelta,
      wrongCount: current.wrongCount + wrongDelta,
      answers: current.answers.map((answer) =>
        answer.toeicQuestionId === toeicQuestionId ? gradedAnswer : answer,
      ),
    };
  }

  return {
    ...current,
    correctCount: current.correctCount + (isCorrect ? 1 : 0),
    wrongCount:
      current.wrongCount + (mode === "practice" && !isCorrect ? 1 : 0),
    answers: [...current.answers, gradedAnswer],
  };
}

function applySelectionOnly(
  current: PracticeSessionResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
  existingAnswer?: PracticeSessionAnswer,
): PracticeSessionResult {
  const nextAnswer: PracticeSessionAnswer = {
    toeicQuestionId,
    selectedKey,
  };

  if (existingAnswer) {
    return {
      ...current,
      answers: current.answers.map((answer) =>
        answer.toeicQuestionId === toeicQuestionId ? nextAnswer : answer,
      ),
    };
  }

  return {
    ...current,
    answers: [...current.answers, nextAnswer],
  };
}

function revertGradedAnswer(
  current: PracticeSessionResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
  mode: PracticeMode,
  existingAnswer?: PracticeSessionAnswer,
): PracticeSessionResult {
  const nextAnswer: PracticeSessionAnswer = {
    toeicQuestionId,
    selectedKey,
  };

  if (!existingAnswer || !isPracticeAnswerGraded(existingAnswer)) {
    return applySelectionOnly(
      current,
      toeicQuestionId,
      selectedKey,
      existingAnswer,
    );
  }

  const wasCorrect = existingAnswer.isCorrect === true;
  const correctDelta = wasCorrect ? -1 : 0;
  const wrongDelta = mode === "practice" && !wasCorrect ? -1 : 0;

  return {
    ...current,
    correctCount: current.correctCount + correctDelta,
    wrongCount: current.wrongCount + wrongDelta,
    answers: current.answers.map((answer) =>
      answer.toeicQuestionId === toeicQuestionId ? nextAnswer : answer,
    ),
  };
}

export function usePracticeSession({
  accessToken,
  clearSession,
  testId,
  partNumber,
  selectedParts: selectedPartsInput,
  mode = "practice",
  enabled,
  answerKeyMap,
}: UsePracticeSessionParams) {
  const queryClient = useQueryClient();
  const selectedParts = useMemo(
    () => normalizePracticeParts(partNumber, selectedPartsInput),
    [partNumber, selectedPartsInput],
  );
  const queryKey = getPracticeSessionQueryKey(testId, selectedParts, mode);
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [failedQuestionIds, setFailedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const syncVersionsRef = useRef(new Map<number, number>());

  const sessionQuery = useQuery({
    queryKey,
    queryFn: () =>
      createToeicSessionRequest({
        accessToken,
        clearSession,
        testId,
        partNumbers: selectedParts,
        mode,
      }),
    enabled: enabled && Boolean(accessToken),
    staleTime: Infinity,
    gcTime: mode === "review_wrong" ? 0 : 5 * 60 * 1000,
    refetchOnMount: mode === "review_wrong" ? false : "always",
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

  const bumpSyncVersion = useCallback((toeicQuestionId: number) => {
    const nextVersion = (syncVersionsRef.current.get(toeicQuestionId) ?? 0) + 1;
    syncVersionsRef.current.set(toeicQuestionId, nextVersion);
    return nextVersion;
  }, []);

  const reconcileGradedResult = useCallback(
    (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      result: SubmitAnswerResult,
      syncVersion: number,
    ) => {
      if ((syncVersionsRef.current.get(toeicQuestionId) ?? 0) !== syncVersion) {
        return;
      }

      if (
        result.isCorrect === undefined ||
        !result.answerKey ||
        !result.graded
      ) {
        return;
      }

      const answerKey = result.answerKey;
      const isCorrect = result.isCorrect;

      queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        const existingAnswer = current.answers.find(
          (answer) => answer.toeicQuestionId === toeicQuestionId,
        );

        return applyGradedAnswer(
          current,
          toeicQuestionId,
          selectedKey,
          answerKey,
          isCorrect,
          mode,
          existingAnswer,
        );
      });
    },
    [mode, queryClient, queryKey],
  );

  const syncAnswerToServer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: SyncAnswerOptions,
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

      const syncVersion = bumpSyncVersion(toeicQuestionId);

      setPendingQuestionIds((current) => new Set(current).add(toeicQuestionId));
      setFailedQuestionIds((current) => {
        const next = new Set(current);
        next.delete(toeicQuestionId);
        return next;
      });

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

        if ((syncVersionsRef.current.get(toeicQuestionId) ?? 0) !== syncVersion) {
          return result;
        }

        if (!result.graded) {
          queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
            if (!current) {
              return current;
            }

            const existing = current.answers.find(
              (answer) => answer.toeicQuestionId === toeicQuestionId,
            );

            return applySelectionOnly(
              current,
              toeicQuestionId,
              selectedKey,
              existing,
            );
          });

          return result;
        }

        if (options?.selectionOnly) {
          queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
            if (!current) {
              return current;
            }

            const existing = current.answers.find(
              (answer) => answer.toeicQuestionId === toeicQuestionId,
            );

            return applySelectionOnly(
              current,
              toeicQuestionId,
              selectedKey,
              existing,
            );
          });

          return result;
        }

        if (usesDeferredGroupGrading(partNumber, mode)) {
          await Promise.all([
            queryClient.refetchQueries({ queryKey }),
            queryClient.invalidateQueries({
              queryKey: ["tests"],
            }),
          ]);
          return result;
        }

        if (mode === "review_wrong" && result.isCorrect) {
          await queryClient.invalidateQueries({
            queryKey: getPracticeSessionQueryKey(testId, selectedParts, "practice"),
          });
        }

        reconcileGradedResult(toeicQuestionId, selectedKey, result, syncVersion);

        await queryClient.invalidateQueries({
          queryKey: ["tests"],
        });

        return result;
      } catch {
        if ((syncVersionsRef.current.get(toeicQuestionId) ?? 0) === syncVersion) {
          setFailedQuestionIds((current) => new Set(current).add(toeicQuestionId));
        }
        return null;
      } finally {
        setPendingQuestionIds((current) => {
          const next = new Set(current);
          next.delete(toeicQuestionId);
          return next;
        });
      }
    },
    [
      accessToken,
      answersByQuestionId,
      bumpSyncVersion,
      clearSession,
      mode,
      partNumber,
      selectedParts,
      queryClient,
      queryKey,
      reconcileGradedResult,
      sessionId,
      testId,
    ],
  );

  const gradeLocally = useCallback(
    (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: { deferGrade?: boolean },
    ) => {
      queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        const existingAnswer = current.answers.find(
          (answer) => answer.toeicQuestionId === toeicQuestionId,
        );

        if (options?.deferGrade) {
          return applySelectionOnly(
            current,
            toeicQuestionId,
            selectedKey,
            existingAnswer,
          );
        }

        const answerKey = answerKeyMap?.get(toeicQuestionId);
        if (!answerKey) {
          return applySelectionOnly(
            current,
            toeicQuestionId,
            selectedKey,
            existingAnswer,
          );
        }

        return applyGradedAnswer(
          current,
          toeicQuestionId,
          selectedKey,
          answerKey,
          selectedKey === answerKey,
          mode,
          existingAnswer,
        );
      });
    },
    [answerKeyMap, mode, queryClient, queryKey],
  );

  const gradeGroupLocally = useCallback(
    (
      entries: Array<{ toeicQuestionId: number; selectedKey: OptionKey }>,
    ) => {
      if (!answerKeyMap) {
        return;
      }

      queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        let next = current;

        for (const entry of entries) {
          const answerKey = answerKeyMap.get(entry.toeicQuestionId);
          if (!answerKey) {
            continue;
          }

          const existingAnswer = next.answers.find(
            (answer) => answer.toeicQuestionId === entry.toeicQuestionId,
          );

          next = applyGradedAnswer(
            next,
            entry.toeicQuestionId,
            entry.selectedKey,
            answerKey,
            entry.selectedKey === answerKey,
            mode,
            existingAnswer,
          );
        }

        return next;
      });
    },
    [answerKeyMap, mode, queryClient, queryKey],
  );

  const rollbackGroupGrade = useCallback(
    (
      entries: Array<{ toeicQuestionId: number; selectedKey: OptionKey }>,
    ) => {
      queryClient.setQueryData<PracticeSessionResult>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        let next = current;

        for (const entry of entries) {
          const existingAnswer = next.answers.find(
            (answer) => answer.toeicQuestionId === entry.toeicQuestionId,
          );

          next = revertGradedAnswer(
            next,
            entry.toeicQuestionId,
            entry.selectedKey,
            mode,
            existingAnswer,
          );
        }

        return next;
      });
    },
    [mode, queryClient, queryKey],
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

      void syncAnswerToServer(toeicQuestionId, selectedKey, {
        replace: options?.replace,
        selectionOnly: options?.selectionOnly,
      });
    },
    [answersByQuestionId, gradeLocally, syncAnswerToServer],
  );

  const retrySync = useCallback(
    (toeicQuestionId: number) => {
      const answer = answersByQuestionId.get(toeicQuestionId);
      if (!answer?.selectedKey) {
        return;
      }

      void syncAnswerToServer(toeicQuestionId, answer.selectedKey, {
        replace: true,
      });
    },
    [answersByQuestionId, syncAnswerToServer],
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

  const submitReviewGroupAnswersBatch = useCallback(
    async (
      groupId: number,
      answers: Array<{
        toeicQuestionId: number;
        selectedKey: OptionKey;
      }>,
    ) => {
      if (!accessToken || !sessionId) {
        return null;
      }

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

        setFailedQuestionIds((current) => {
          const next = new Set(current);
          for (const answer of answers) {
            next.delete(answer.toeicQuestionId);
          }
          return next;
        });

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getPracticeSessionQueryKey(testId, selectedParts, "practice"),
          }),
          queryClient.invalidateQueries({
            queryKey: ["tests"],
          }),
        ]);

        return result;
      } catch {
        for (const answer of answers) {
          setFailedQuestionIds((current) =>
            new Set(current).add(answer.toeicQuestionId),
          );
        }
        throw new Error("Could not save group answers.");
      }
    },
    [
      accessToken,
      clearSession,
      selectedParts,
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

  const isQuestionPending = useCallback(
    (toeicQuestionId: number) => pendingQuestionIds.has(toeicQuestionId),
    [pendingQuestionIds],
  );

  const isQuestionSyncFailed = useCallback(
    (toeicQuestionId: number) => failedQuestionIds.has(toeicQuestionId),
    [failedQuestionIds],
  );

  const hasSyncFailures = failedQuestionIds.size > 0;

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
    isSubmitting: pendingQuestionIds.size > 0,
    isQuestionPending,
    isQuestionSyncFailed,
    hasSyncFailures,
    failedQuestionIds,
    selectAnswer,
    gradeGroupLocally,
    rollbackGroupGrade,
    syncAnswerToServer,
    retrySync,
    submitAnswer,
    submitReviewGroupAnswersBatch,
    completeSession,
  };
}

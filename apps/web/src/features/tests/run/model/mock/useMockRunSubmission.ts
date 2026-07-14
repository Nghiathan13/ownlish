"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  finishToeicRun,
  submitToeicAnswer,
} from "@/entities/toeic/api/toeic";
import type {
  ToeicQuestion,
  ToeicRunResult,
} from "@/entities/toeic/api/types";
import { updateQuestionSelection } from "@/entities/toeic/lib/runState";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";
import {
  removeMockFinishCommand,
  storeMockFinishCommand,
} from "@/features/tests/run/model/mock/mockFinishOutbox";

const ANSWER_SYNC_ERROR =
  "Some answers could not be saved. Retry them before finishing.";
const ANSWER_PENDING_ERROR =
  "Wait for all answers to finish saving before finishing.";
const FINISH_RETRY_DELAYS = [1_000, 2_000, 5_000] as const;

type QuestionSyncEntry = {
  desiredKey: OptionKey;
  worker: Promise<void> | null;
};

type UseMockRunSubmissionParams = {
  sessionId: string;
  queryKey: readonly unknown[];
  isAuthenticated: boolean;
  isFinished: boolean;
  onFinishCompleted?: () => void;
  shouldRecoverFinish?: boolean;
};

type OptimisticQuestionGrade = Pick<
  ToeicQuestion,
  "isCorrect" | "selectedKey" | "status"
>;

function applyMockFinishSnapshot(
  current: ToeicRunResult,
  snapshot: ToeicRunResult,
): ToeicRunResult {
  const gradeByQuestionId = new Map<number, OptimisticQuestionGrade>();
  let correctCount = 0;
  let wrongCount = 0;

  for (const group of snapshot.groups) {
    for (const question of group.questions) {
      if (!question.answerKey) {
        if (question.status === "right") {
          correctCount += 1;
        } else if (question.status === "wrong") {
          wrongCount += 1;
        }

        gradeByQuestionId.set(question.id, {
          selectedKey: question.selectedKey,
          status: question.status,
          isCorrect: question.isCorrect,
        });
        continue;
      }

      const isCorrect = question.selectedKey === question.answerKey;
      if (isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      gradeByQuestionId.set(question.id, {
        selectedKey: question.selectedKey,
        status: isCorrect ? "right" : "wrong",
        isCorrect,
      });
    }
  }

  return {
    ...current,
    correctCount,
    wrongCount,
    groups: current.groups.map((group) => {
      const questions = group.questions.map((question) => {
        const grade = gradeByQuestionId.get(question.id);
        return grade ? { ...question, ...grade } : question;
      });
      const statuses = questions.map((question) => question.status);
      const groupStatus = statuses.some((status) => status === "wrong")
        ? "wrong"
        : statuses.length > 0 &&
            statuses.every((status) => status === "right")
          ? "right"
          : null;

      return { ...group, groupStatus, questions };
    }),
  };
}

export function useMockRunSubmission({
  sessionId,
  queryKey,
  isAuthenticated,
  isFinished,
  onFinishCompleted,
  shouldRecoverFinish = false,
}: UseMockRunSubmissionParams) {
  const queryClient = useQueryClient();
  const syncEntriesRef = useRef(new Map<number, QuestionSyncEntry>());
  const failedQuestionIdsRef = useRef(new Set<number>());
  const isFinishingRef = useRef(false);
  const hasFinishIntentRef = useRef(false);
  const hasServerAcceptedRef = useRef(false);
  const hasCompletedFinishRef = useRef(false);
  const hasStartedRecoveryRef = useRef(false);
  const hasNotifiedRecoveryRef = useRef(false);
  const isRecoveryRef = useRef(false);
  const finishSnapshotRef = useRef<ToeicRunResult | null>(null);
  const hasAppliedSnapshotRef = useRef(false);
  const finishPromiseRef = useRef<Promise<void> | null>(null);
  const finishRunRef = useRef<(() => Promise<void>) | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayIndexRef = useRef(0);
  const isMountedRef = useRef(true);
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [failedQuestionIds, setFailedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isFinishAccepted, setIsFinishAccepted] = useState(false);
  const [isFinishFailureOpen, setIsFinishFailureOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const scheduleFinishReplay = useCallback(() => {
    if (
      retryTimerRef.current !== null ||
      hasCompletedFinishRef.current ||
      !isMountedRef.current ||
      !isAuthenticated
    ) {
      return;
    }

    const delay =
      FINISH_RETRY_DELAYS[
        Math.min(
          retryDelayIndexRef.current,
          FINISH_RETRY_DELAYS.length - 1,
        )
      ];
    retryDelayIndexRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      if (!isMountedRef.current || hasCompletedFinishRef.current) {
        return;
      }

      void finishRunRef.current?.();
    }, delay);
  }, [isAuthenticated]);

  const setQuestionFailed = useCallback(
    (toeicQuestionId: number, failed: boolean) => {
      if (failedQuestionIdsRef.current.has(toeicQuestionId) === failed) {
        return;
      }

      const next = new Set(failedQuestionIdsRef.current);
      if (failed) {
        next.add(toeicQuestionId);
      } else {
        next.delete(toeicQuestionId);
      }

      failedQuestionIdsRef.current = next;
      setFailedQuestionIds(next);
    },
    [],
  );

  const startQuestionSync = useCallback(
    (toeicQuestionId: number) => {
      const entry = syncEntriesRef.current.get(toeicQuestionId);
      if (!entry || entry.worker) {
        return entry?.worker ?? Promise.resolve();
      }

      setPendingQuestionIds((current) =>
        new Set(current).add(toeicQuestionId),
      );

      const worker = (async () => {
        while (true) {
          const currentEntry = syncEntriesRef.current.get(toeicQuestionId);
          if (!currentEntry) {
            return;
          }

          const submittedKey = currentEntry.desiredKey;

          try {
            await runAuthenticatedRequest({
              request: (token) =>
                submitToeicAnswer(token, sessionId, {
                  toeicQuestionId,
                  selectedKey: submittedKey,
                }),
            });
          } catch {
            const latestEntry = syncEntriesRef.current.get(toeicQuestionId);
            if (latestEntry?.desiredKey !== submittedKey) {
              continue;
            }

            setQuestionFailed(toeicQuestionId, true);
            return;
          }

          const latestEntry = syncEntriesRef.current.get(toeicQuestionId);
          if (!latestEntry || latestEntry.desiredKey === submittedKey) {
            syncEntriesRef.current.delete(toeicQuestionId);
            setQuestionFailed(toeicQuestionId, false);
            return;
          }
        }
      })();

      entry.worker = worker;
      void worker.finally(() => {
        const latestEntry = syncEntriesRef.current.get(toeicQuestionId);
        if (latestEntry?.worker === worker) {
          latestEntry.worker = null;
        }

        if (isMountedRef.current) {
          setPendingQuestionIds((current) => {
            const next = new Set(current);
            next.delete(toeicQuestionId);
            return next;
          });
        }
      });

      return worker;
    },
    [sessionId, setQuestionFailed],
  );

  const selectAnswer = useCallback(
    (toeicQuestionId: number, selectedKey: OptionKey) => {
      if (!isAuthenticated || isFinished) {
        return;
      }

      queryClient.setQueryData<ToeicRunResult>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return updateQuestionSelection(current, toeicQuestionId, selectedKey);
      });

      if (hasFinishIntentRef.current) {
        if (hasCompletedFinishRef.current) {
          void queryClient.invalidateQueries({
            queryKey,
            exact: true,
            refetchType: "none",
          });
        }
        return;
      }

      setFinishError(null);
      setQuestionFailed(toeicQuestionId, false);

      const currentEntry = syncEntriesRef.current.get(toeicQuestionId);
      if (currentEntry) {
        currentEntry.desiredKey = selectedKey;
      } else {
        syncEntriesRef.current.set(toeicQuestionId, {
          desiredKey: selectedKey,
          worker: null,
        });
      }

      void startQuestionSync(toeicQuestionId);
    },
    [
      isAuthenticated,
      isFinished,
      queryClient,
      queryKey,
      setQuestionFailed,
      startQuestionSync,
    ],
  );

  const retryFailedAnswers = useCallback(() => {
    if (isFinishingRef.current) {
      return;
    }

    const questionIds = Array.from(failedQuestionIdsRef.current);
    failedQuestionIdsRef.current = new Set();
    setFailedQuestionIds(new Set());
    setFinishError(null);

    for (const toeicQuestionId of questionIds) {
      const activeWorker = syncEntriesRef.current.get(toeicQuestionId)?.worker;
      if (activeWorker) {
        void activeWorker.then(() => startQuestionSync(toeicQuestionId));
      } else {
        void startQuestionSync(toeicQuestionId);
      }
    }
  }, [startQuestionSync]);

  const applySnapshotForResult = useCallback(() => {
    const snapshot = finishSnapshotRef.current;
    if (!snapshot || hasAppliedSnapshotRef.current) {
      return;
    }

    hasAppliedSnapshotRef.current = true;
    queryClient.setQueryData<ToeicRunResult>(queryKey, (current) =>
      current ? applyMockFinishSnapshot(current, snapshot) : current,
    );

    if (isMountedRef.current) {
      setIsFinishAccepted(true);
      setIsResultOpen(true);
    }
  }, [queryClient, queryKey]);

  const completeFinish = useCallback(() => {
    hasCompletedFinishRef.current = true;
    clearRetryTimer();
    removeMockFinishCommand(sessionId);
    void queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: "none",
    });

    if (
      isRecoveryRef.current &&
      !hasNotifiedRecoveryRef.current &&
      isMountedRef.current
    ) {
      hasNotifiedRecoveryRef.current = true;
      onFinishCompleted?.();
    }
  }, [clearRetryTimer, onFinishCompleted, queryClient, queryKey, sessionId]);

  const finishRun = useCallback(() => {
    if (!isAuthenticated || !sessionId || hasCompletedFinishRef.current) {
      return Promise.resolve();
    }

    if (finishPromiseRef.current) {
      return finishPromiseRef.current;
    }

    if (!hasFinishIntentRef.current) {
      if (failedQuestionIdsRef.current.size > 0) {
        setFinishError(ANSWER_SYNC_ERROR);
        return Promise.resolve();
      }

      if (syncEntriesRef.current.size > 0) {
        setFinishError(ANSWER_PENDING_ERROR);
        return Promise.resolve();
      }

      try {
        storeMockFinishCommand(sessionId);
      } catch {
        setFinishError("Cannot save the Finish request on this device.");
        setIsFinishFailureOpen(true);
        return Promise.resolve();
      }

      finishSnapshotRef.current =
        queryClient.getQueryData<ToeicRunResult>(queryKey) ?? null;
      hasFinishIntentRef.current = true;
    }

    clearRetryTimer();
    isFinishingRef.current = true;
    const showRequestProgress = !hasServerAcceptedRef.current;
    if (showRequestProgress) {
      setIsFinishing(true);
    }
    setFinishError(null);
    setIsFinishFailureOpen(false);

    const finishPromise = (async () => {
      try {
        const acknowledgement = await runAuthenticatedRequest({
          request: (token) => finishToeicRun(token, sessionId),
        });

        hasServerAcceptedRef.current = true;
        applySnapshotForResult();

        if (acknowledgement.status === "completed") {
          completeFinish();
        } else {
          scheduleFinishReplay();
        }
      } catch (error) {
        if (hasServerAcceptedRef.current) {
          scheduleFinishReplay();
          return;
        }

        if (isMountedRef.current) {
          setFinishError(
            error instanceof Error
              ? error.message
              : "Cannot finish mock test.",
          );
          setIsFinishFailureOpen(true);
        }
      } finally {
        isFinishingRef.current = false;
        finishPromiseRef.current = null;
        if (showRequestProgress && isMountedRef.current) {
          setIsFinishing(false);
        }
      }
    })();

    finishPromiseRef.current = finishPromise;
    return finishPromise;
  }, [
    applySnapshotForResult,
    clearRetryTimer,
    completeFinish,
    isAuthenticated,
    queryClient,
    queryKey,
    scheduleFinishReplay,
    sessionId,
  ]);

  useEffect(() => {
    finishRunRef.current = finishRun;
  }, [finishRun]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearRetryTimer();
    };
  }, [clearRetryTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearRetryTimer();
      return;
    }

    if (
      hasServerAcceptedRef.current &&
      hasFinishIntentRef.current &&
      !hasCompletedFinishRef.current &&
      !finishPromiseRef.current
    ) {
      scheduleFinishReplay();
    }
  }, [clearRetryTimer, isAuthenticated, scheduleFinishReplay]);

  useEffect(() => {
    if (!shouldRecoverFinish) {
      hasStartedRecoveryRef.current = false;
      return;
    }

    isRecoveryRef.current = true;
    hasFinishIntentRef.current = true;

    if (isFinished) {
      completeFinish();
      return;
    }

    if (!isAuthenticated || hasStartedRecoveryRef.current) {
      return;
    }

    hasStartedRecoveryRef.current = true;
    void finishRun();
  }, [
    completeFinish,
    finishRun,
    isAuthenticated,
    isFinished,
    shouldRecoverFinish,
  ]);

  const isQuestionPending = useCallback(
    (toeicQuestionId: number) => pendingQuestionIds.has(toeicQuestionId),
    [pendingQuestionIds],
  );

  const closeResult = useCallback(() => setIsResultOpen(false), []);
  const closeFinishFailure = useCallback(
    () => setIsFinishFailureOpen(false),
    [],
  );

  return {
    closeFinishFailure,
    closeResult,
    finishError,
    finishRun,
    hasPendingAnswers: pendingQuestionIds.size > 0,
    hasSyncFailures: failedQuestionIds.size > 0,
    isFinishAccepted,
    isFinishFailureOpen,
    isFinishing,
    isQuestionPending,
    isResultOpen,
    retryFailedAnswers,
    selectAnswer,
  };
}

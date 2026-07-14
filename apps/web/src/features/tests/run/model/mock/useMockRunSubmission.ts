"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  finishToeicRun,
  getToeicRun,
  submitToeicAnswer,
} from "@/entities/toeic/api/toeic";
import type { ToeicRunResult } from "@/entities/toeic/api/types";
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
  selectedParts?: number[];
  shouldRecoverFinish?: boolean;
};

export function useMockRunSubmission({
  sessionId,
  queryKey,
  isAuthenticated,
  isFinished,
  onFinishCompleted,
  selectedParts,
  shouldRecoverFinish = false,
}: UseMockRunSubmissionParams) {
  const queryClient = useQueryClient();
  const syncEntriesRef = useRef(new Map<number, QuestionSyncEntry>());
  const failedQuestionIdsRef = useRef(new Set<number>());
  const isFinishingRef = useRef(false);
  const hasFinishIntentRef = useRef(false);
  const hasStartedRecoveryRef = useRef(false);
  const finishPromiseRef = useRef<Promise<void> | null>(null);
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [failedQuestionIds, setFailedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isFinishFailureOpen, setIsFinishFailureOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);

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

        setPendingQuestionIds((current) => {
          const next = new Set(current);
          next.delete(toeicQuestionId);
          return next;
        });
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

  const finishRun = useCallback(() => {
    if (!isAuthenticated || !sessionId) {
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

      hasFinishIntentRef.current = true;
    }

    isFinishingRef.current = true;
    setIsFinishing(true);
    setFinishError(null);
    setIsFinishFailureOpen(false);

    const finishPromise = (async () => {
      try {
        await runAuthenticatedRequest({
          request: (token) => finishToeicRun(token, sessionId),
        });

        const result = await runAuthenticatedRequest({
          request: (token) =>
            getToeicRun(token, sessionId, { parts: selectedParts }),
        });

        queryClient.setQueryData(queryKey, result);
        removeMockFinishCommand(sessionId);
        hasFinishIntentRef.current = false;
        onFinishCompleted?.();
        setIsResultOpen(true);
      } catch (error) {
        setFinishError(
          error instanceof Error ? error.message : "Cannot finish mock test.",
        );
        setIsFinishFailureOpen(true);
      } finally {
        isFinishingRef.current = false;
        finishPromiseRef.current = null;
        setIsFinishing(false);
      }
    })();

    finishPromiseRef.current = finishPromise;
    return finishPromise;
  }, [
    isAuthenticated,
    onFinishCompleted,
    queryClient,
    queryKey,
    selectedParts,
    sessionId,
  ]);

  useEffect(() => {
    if (!shouldRecoverFinish) {
      hasStartedRecoveryRef.current = false;
      return;
    }

    hasFinishIntentRef.current = true;

    if (isFinished) {
      removeMockFinishCommand(sessionId);
      hasFinishIntentRef.current = false;
      onFinishCompleted?.();
      return;
    }

    if (!isAuthenticated || hasStartedRecoveryRef.current) {
      return;
    }

    hasStartedRecoveryRef.current = true;
    void finishRun();
  }, [finishRun, isAuthenticated, isFinished, onFinishCompleted, sessionId, shouldRecoverFinish]);

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
    isFinishFailureOpen,
    isFinishing,
    isQuestionPending,
    isResultOpen,
    retryFailedAnswers,
    selectAnswer,
  };
}

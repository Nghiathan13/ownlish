"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

export type PracticeAnswerSubmission = {
  toeicQuestionId: number;
  selectedKey: OptionKey;
};

type QueueEntry = {
  desiredKey: OptionKey;
};

type UsePracticeAnswerSubmissionParams<TResult> = {
  submit: (submission: PracticeAnswerSubmission) => Promise<TResult>;
  onSuccess?: (
    result: TResult,
    submission: PracticeAnswerSubmission,
  ) => void | Promise<void>;
};

export function usePracticeAnswerSubmission<TResult>({
  submit,
  onSuccess,
}: UsePracticeAnswerSubmissionParams<TResult>) {
  const submitRef = useRef(submit);
  const onSuccessRef = useRef(onSuccess);
  const entriesRef = useRef(new Map<number, QueueEntry>());
  const queueOrderRef = useRef<number[]>([]);
  const failedQuestionIdsRef = useRef(new Set<number>());
  const workerRef = useRef<Promise<void> | null>(null);
  const startWorkerRef = useRef<() => void>(() => undefined);
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [failedQuestionIds, setFailedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    submitRef.current = submit;
    onSuccessRef.current = onSuccess;
  }, [onSuccess, submit]);

  const setQuestionPending = useCallback(
    (toeicQuestionId: number, pending: boolean) => {
      setPendingQuestionIds((current) => {
        if (current.has(toeicQuestionId) === pending) {
          return current;
        }

        const next = new Set(current);
        if (pending) {
          next.add(toeicQuestionId);
        } else {
          next.delete(toeicQuestionId);
        }
        return next;
      });
    },
    [],
  );

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

  const processQueue = useCallback(async () => {
    while (queueOrderRef.current.length > 0) {
      const toeicQuestionId = queueOrderRef.current[0];
      const entry = entriesRef.current.get(toeicQuestionId);

      if (!entry) {
        queueOrderRef.current.shift();
        continue;
      }

      const submission: PracticeAnswerSubmission = {
        toeicQuestionId,
        selectedKey: entry.desiredKey,
      };

      try {
        const result = await submitRef.current(submission);
        const latestEntry = entriesRef.current.get(toeicQuestionId);

        if (!latestEntry) {
          queueOrderRef.current.shift();
          setQuestionPending(toeicQuestionId, false);
          continue;
        }

        if (latestEntry.desiredKey !== submission.selectedKey) {
          continue;
        }

        await onSuccessRef.current?.(result, submission);
      } catch {
        const latestEntry = entriesRef.current.get(toeicQuestionId);

        if (latestEntry?.desiredKey !== submission.selectedKey) {
          continue;
        }

        setQuestionPending(toeicQuestionId, false);
        setQuestionFailed(toeicQuestionId, true);
        return;
      }

      const latestEntry = entriesRef.current.get(toeicQuestionId);
      if (latestEntry?.desiredKey !== submission.selectedKey) {
        continue;
      }

      entriesRef.current.delete(toeicQuestionId);
      queueOrderRef.current.shift();
      setQuestionPending(toeicQuestionId, false);
      setQuestionFailed(toeicQuestionId, false);
    }
  }, [setQuestionFailed, setQuestionPending]);

  const startWorker = useCallback(() => {
    if (
      workerRef.current ||
      failedQuestionIdsRef.current.size > 0 ||
      queueOrderRef.current.length === 0
    ) {
      return;
    }

    setIsSubmitting(true);
    const worker = processQueue();
    workerRef.current = worker;

    const settleWorker = (completed: boolean) => {
      if (workerRef.current !== worker) {
        return;
      }

      workerRef.current = null;
      setIsSubmitting(false);

      if (
        completed &&
        failedQuestionIdsRef.current.size === 0 &&
        queueOrderRef.current.length > 0
      ) {
        startWorkerRef.current();
      }
    };

    void worker.then(
      () => settleWorker(true),
      () => settleWorker(false),
    );
  }, [processQueue]);

  useEffect(() => {
    startWorkerRef.current = startWorker;
  }, [startWorker]);

  const queueAnswer = useCallback(
    (toeicQuestionId: number, selectedKey: OptionKey) => {
      const existingEntry = entriesRef.current.get(toeicQuestionId);
      if (existingEntry) {
        existingEntry.desiredKey = selectedKey;
      } else {
        entriesRef.current.set(toeicQuestionId, { desiredKey: selectedKey });
        queueOrderRef.current.push(toeicQuestionId);
      }

      if (!failedQuestionIdsRef.current.has(toeicQuestionId)) {
        setQuestionPending(toeicQuestionId, true);
      }
      startWorker();
    },
    [setQuestionPending, startWorker],
  );

  const retryFailedAnswers = useCallback(() => {
    const questionIds = Array.from(failedQuestionIdsRef.current);
    if (questionIds.length === 0) {
      return;
    }

    failedQuestionIdsRef.current = new Set();
    setFailedQuestionIds(new Set());
    setPendingQuestionIds((current) => {
      const next = new Set(current);
      for (const toeicQuestionId of questionIds) {
        next.add(toeicQuestionId);
      }
      return next;
    });
    startWorkerRef.current();
  }, []);

  const isQuestionPending = useCallback(
    (toeicQuestionId: number) => pendingQuestionIds.has(toeicQuestionId),
    [pendingQuestionIds],
  );

  const isQuestionSyncFailed = useCallback(
    (toeicQuestionId: number) => failedQuestionIds.has(toeicQuestionId),
    [failedQuestionIds],
  );

  return {
    failedQuestionIds,
    hasSyncFailures: failedQuestionIds.size > 0,
    isQuestionPending,
    isQuestionSyncFailed,
    isSubmitting,
    queueAnswer,
    retryFailedAnswers,
  };
}

"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { submitToeicAnswer } from "@/entities/toeic/api/toeic";
import type {
  PracticeMode,
  SubmitAnswerResult,
  ToeicQuestion,
  ToeicRunResult,
} from "@/entities/toeic/api/types";
import { invalidateToeicRunCaches } from "@/entities/toeic/lib/toeicCache";
import { applySelectionOnly } from "@/entities/toeic/lib/runState";
import { isPracticeAnswerGraded } from "@/features/tests/run/lib/practiceAnswers";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

type SyncAnswerOptions = {
  replace?: boolean;
};

type UsePracticeAnswerSyncParams = {
  sessionId: string;
  mode: PracticeMode;
  queryKey: readonly unknown[];
  isAuthenticated: boolean;
  answersByQuestionId: Map<number, ToeicQuestion>;
};

export function usePracticeAnswerSync({
  sessionId,
  mode,
  queryKey,
  isAuthenticated,
  answersByQuestionId,
}: UsePracticeAnswerSyncParams) {
  const queryClient = useQueryClient();
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [failedQuestionIds, setFailedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const syncVersionsRef = useRef(new Map<number, number>());

  const bumpSyncVersion = useCallback((toeicQuestionId: number) => {
    const nextVersion = (syncVersionsRef.current.get(toeicQuestionId) ?? 0) + 1;
    syncVersionsRef.current.set(toeicQuestionId, nextVersion);
    return nextVersion;
  }, []);

  const syncAnswerToServer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: SyncAnswerOptions,
    ): Promise<SubmitAnswerResult | null> => {
      if (!isAuthenticated || !sessionId) {
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
          request: (token) =>
            submitToeicAnswer(token, sessionId, {
              toeicQuestionId,
              selectedKey,
              mode,
            }),
        });

        if ((syncVersionsRef.current.get(toeicQuestionId) ?? 0) !== syncVersion) {
          return result;
        }

        if (!result.graded) {
          queryClient.setQueryData<ToeicRunResult>(queryKey, (current) => {
            if (!current) {
              return current;
            }

            return applySelectionOnly(current, toeicQuestionId, selectedKey);
          });

          return result;
        }

        if (mode === "review_wrong") {
          await invalidateToeicRunCaches(queryClient);
          return result;
        }

        await Promise.all([
          queryClient.refetchQueries({ queryKey }),
          queryClient.invalidateQueries({ queryKey: ["tests"] }),
        ]);

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
      answersByQuestionId,
      bumpSyncVersion,
      isAuthenticated,
      mode,
      queryClient,
      queryKey,
      sessionId,
    ],
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

  const isQuestionPending = useCallback(
    (toeicQuestionId: number) => pendingQuestionIds.has(toeicQuestionId),
    [pendingQuestionIds],
  );

  const isQuestionSyncFailed = useCallback(
    (toeicQuestionId: number) => failedQuestionIds.has(toeicQuestionId),
    [failedQuestionIds],
  );

  return {
    syncAnswerToServer,
    retrySync,
    isQuestionPending,
    isQuestionSyncFailed,
    isSubmitting: pendingQuestionIds.size > 0,
    hasSyncFailures: failedQuestionIds.size > 0,
    failedQuestionIds,
  };
}

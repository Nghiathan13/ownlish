"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { submitToeicAnswer } from "@/entities/toeic/api/toeic";
import type { ToeicRunResult } from "@/entities/toeic/api/types";
import { updateQuestionSelection } from "@/entities/toeic/lib/runState";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

type UseMockAnswerSyncParams = {
  sessionId: string;
  queryKey: readonly unknown[];
  isAuthenticated: boolean;
  isFinished: boolean;
};

export function useMockAnswerSync({
  sessionId,
  queryKey,
  isAuthenticated,
  isFinished,
}: UseMockAnswerSyncParams) {
  const queryClient = useQueryClient();
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const pendingSubmitRequestsRef = useRef(new Set<Promise<unknown>>());

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

      setPendingQuestionIds((current) => new Set(current).add(toeicQuestionId));

      const submitRequest = runAuthenticatedRequest({
        request: (token) =>
          submitToeicAnswer(token, sessionId, {
            toeicQuestionId,
            selectedKey,
          }),
      })
        .then(() => {
          setPendingQuestionIds((current) => {
            const next = new Set(current);
            next.delete(toeicQuestionId);
            return next;
          });
        })
        .catch(() => {
          setPendingQuestionIds((current) => {
            const next = new Set(current);
            next.delete(toeicQuestionId);
            return next;
          });
        })
        .finally(() => {
          pendingSubmitRequestsRef.current.delete(submitRequest);
        });

      pendingSubmitRequestsRef.current.add(submitRequest);
    },
    [isAuthenticated, isFinished, queryClient, queryKey, sessionId],
  );

  const waitForPendingSubmissions = useCallback(() => {
    return Promise.allSettled(pendingSubmitRequestsRef.current);
  }, []);

  const isQuestionPending = useCallback(
    (toeicQuestionId: number) => pendingQuestionIds.has(toeicQuestionId),
    [pendingQuestionIds],
  );

  return {
    selectAnswer,
    waitForPendingSubmissions,
    isQuestionPending,
  };
}

"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { finishToeicRun } from "@/entities/toeic/api/toeic";
import { invalidateToeicRunCaches } from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

type UseFinishMockRunParams = {
  sessionId: string;
  queryKey: readonly unknown[];
  isAuthenticated: boolean;
  waitForPendingSubmissions: () => Promise<PromiseSettledResult<unknown>[]>;
};

export function useFinishMockRun({
  sessionId,
  queryKey,
  isAuthenticated,
  waitForPendingSubmissions,
}: UseFinishMockRunParams) {
  const queryClient = useQueryClient();
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const finishRun = useCallback(async () => {
    if (!isAuthenticated || !sessionId) {
      return;
    }

    setFinishError(null);
    try {
      await waitForPendingSubmissions();
      const result = await runAuthenticatedRequest({
        request: (token) => finishToeicRun(token, sessionId),
      });
      queryClient.setQueryData(queryKey, result);
      await invalidateToeicRunCaches(queryClient);
      setIsResultOpen(true);
    } catch (error) {
      setFinishError(
        error instanceof Error ? error.message : "Cannot finish mock test.",
      );
    }
  }, [
    isAuthenticated,
    queryClient,
    queryKey,
    sessionId,
    waitForPendingSubmissions,
  ]);

  return {
    finishRun,
    finishError,
    isResultOpen,
    closeResult: () => setIsResultOpen(false),
  };
}

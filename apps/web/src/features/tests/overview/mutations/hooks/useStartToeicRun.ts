"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createToeicRun } from "@/entities/toeic/api/toeic";
import type { PracticeMode, ToeicRunMode } from "@/entities/toeic/api/types";
import {
  getPracticeSessionQueryKey,
  getToeicRunQueryKey,
} from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getToeicRunPath } from "@/features/tests/shared/lib/toeicRunPaths";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";

export type StartToeicRunVariables = {
  testId: number;
  partNumbers: number[];
  mode: ToeicRunMode;
};

export function useStartToeicRun() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (variables: StartToeicRunVariables) => {
      const normalizedParts = normalizeSelectedParts(variables.partNumbers);

      return runAuthenticatedRequest({
        request: (token) =>
          createToeicRun(token, {
            testId: variables.testId,
            partNumbers: normalizedParts,
            mode: variables.mode,
          }),
      });
    },
    onSuccess: (session, variables) => {
      const normalizedParts = normalizeSelectedParts(variables.partNumbers);

      if (session.mode === "mock_test") {
        queryClient.setQueryData(getToeicRunQueryKey(session.sessionId), session);
        return;
      }

      queryClient.setQueryData(
        getPracticeSessionQueryKey(
          session.sessionId,
          normalizedParts,
          session.mode as PracticeMode,
        ),
        session,
      );
    },
  });

  const startRun = async (variables: StartToeicRunVariables) => {
    const normalizedParts = normalizeSelectedParts(variables.partNumbers);
    const session = await mutation.mutateAsync(variables);

    router.push(
      getToeicRunPath(
        session.sessionId,
        variables.mode === "mock_test" ? "mock_test" : variables.mode,
        normalizedParts,
      ),
    );
  };

  return {
    startRun,
    isStarting: mutation.isPending,
    startingTestId: mutation.isPending ? mutation.variables?.testId ?? null : null,
    startError: toQueryErrorMessage(mutation.error, "Cannot start test."),
    resetStartState: mutation.reset,
  };
}

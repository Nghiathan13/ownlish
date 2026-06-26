"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPartPracticeRun } from "@/entities/toeic/api/partPractice";
import type { PracticeMode } from "@/entities/toeic/api/types";
import {
  getPartPracticeSessionQueryKey,
  invalidatePartPracticeOverview,
} from "@/entities/toeic/lib/toeicCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getPartPracticeRunPath } from "@/features/tests/shared/lib/partPracticePaths";
import { toQueryErrorMessage } from "@/features/tests/shared/lib/toQueryErrorMessage";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export type StartPartPracticeRunVariables = {
  partNumber: number;
  mode: PracticeMode;
};

export function useStartPartPracticeRun() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();

  const mutation = useMutation({
    mutationFn: (variables: StartPartPracticeRunVariables) =>
      runAuthenticatedRequest({
        request: (token) =>
          createPartPracticeRun(token, {
            partNumber: variables.partNumber,
            mode: variables.mode,
          }),
      }),
    onSuccess: (session) => {
      queryClient.setQueryData(
        getPartPracticeSessionQueryKey(session.sessionId, session.mode),
        session,
      );
      void invalidatePartPracticeOverview(queryClient, user?.id ?? null);
    },
  });

  const startRun = async (variables: StartPartPracticeRunVariables) => {
    const session = await mutation.mutateAsync(variables);

    router.push(getPartPracticeRunPath(session.sessionId, variables.mode));
  };

  return {
    startRun,
    isStarting: mutation.isPending,
    startingPartNumber: mutation.isPending
      ? mutation.variables?.partNumber ?? null
      : null,
    startError: toQueryErrorMessage(mutation.error, "Cannot start part practice."),
    resetStartState: mutation.reset,
  };
}

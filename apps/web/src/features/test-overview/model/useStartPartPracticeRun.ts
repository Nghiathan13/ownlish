"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRuntimePartPracticeRun,
  invalidatePartPracticeOverview,
  type PracticeMode,
} from "@/entities/toeic-runtime";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import { runAuthenticatedRequest } from "@/entities/session";
import { getPartPracticeRunPath } from "@/entities/toeic-runtime";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import {
  getFirstPartPracticeGroupKey,
  preloadCatalogGroupMedia,
} from "@/entities/toeic-catalog";
import { readPartPracticeGroupKey } from "@/entities/toeic-runtime";

export type StartPartPracticeRunVariables = {
  partNumber: number;
  mode: PracticeMode;
  source: ToeicCatalogSource;
};

type UseStartPartPracticeRunParams = {
  userId: string | null;
};

export function useStartPartPracticeRun({ userId }: UseStartPartPracticeRunParams) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (variables: StartPartPracticeRunVariables) => {
      const part = variables.source.manifest.partPractice.find(
        (candidate) => candidate.number === variables.partNumber,
      );
      if (!part) {
        throw new Error("Part practice data is unavailable.");
      }

      const run = await runAuthenticatedRequest({
        request: (token) =>
          createRuntimePartPracticeRun(token, variables.partNumber),
      });
      const savedGroupKey = readPartPracticeGroupKey(
        variables.partNumber,
        variables.mode,
      );
      const initialGroupKey = savedGroupKey
        ?? getFirstPartPracticeGroupKey(variables.source, variables.partNumber);
      preloadCatalogGroupMedia(variables.source, initialGroupKey);
      return run;
    },
    onSuccess: () => {
      void invalidatePartPracticeOverview(queryClient, userId);
    },
  });

  const startRun = async (variables: StartPartPracticeRunVariables) => {
    const run = await mutation.mutateAsync(variables);

    router.push(
      getPartPracticeRunPath(
        run.sessionId,
        variables.mode,
        variables.partNumber,
      ),
    );
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

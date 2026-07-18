"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRuntimePartPracticeRun } from "@/entities/toeic-runtime/api/runtime";
import {
  getPartPracticeSessionQueryKey,
  invalidatePartPracticeOverview,
} from "@/entities/toeic-runtime/model/cache";
import { materializePartPracticeSession } from "@/entities/toeic-runtime/model/materializePartPracticeSession";
import type { PracticeMode } from "@/entities/toeic/api/types";
import {
  getToeicCatalogDocument,
} from "@/entities/toeic-catalog/api/catalog";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getPartPracticeRunPath } from "@/features/tests/shared/lib/partPracticePaths";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import {
  getFirstPartPracticeGroupKey,
  preloadCatalogGroupMedia,
  preloadPartPracticeSessionMedia,
} from "@/features/tests/shared/model/preloadToeicSessionMedia";
import { readPartPracticeGroupKey } from "@/features/tests/shared/model/partPracticePosition";

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

      const runPromise = runAuthenticatedRequest({
        request: (token) =>
          createRuntimePartPracticeRun(token, variables.partNumber),
      });
      const documentPromise = getToeicCatalogDocument(variables.source, part.path);
      const savedGroupKey = readPartPracticeGroupKey(
        variables.partNumber,
        variables.mode,
      );
      const initialGroupKey = savedGroupKey
        ?? getFirstPartPracticeGroupKey(variables.source, variables.partNumber);
      preloadCatalogGroupMedia(variables.source, initialGroupKey);
      const [run, document] = await Promise.all([runPromise, documentPromise]);
      const session = materializePartPracticeSession(
        document,
        variables.source,
        run,
        variables.mode,
      );
      preloadPartPracticeSessionMedia(variables.source, session, initialGroupKey);
      return session;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(
        getPartPracticeSessionQueryKey(session.sessionId, session.mode),
        session,
      );
      void invalidatePartPracticeOverview(queryClient, userId);
    },
  });

  const startRun = async (variables: StartPartPracticeRunVariables) => {
    const session = await mutation.mutateAsync(variables);

    router.push(
      getPartPracticeRunPath(
        session.sessionId,
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

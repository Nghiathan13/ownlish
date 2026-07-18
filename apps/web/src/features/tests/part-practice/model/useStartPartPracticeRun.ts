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
  resolveToeicCatalogMediaUrl,
} from "@/entities/toeic-catalog/api/catalog";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getPartPracticeRunPath } from "@/features/tests/shared/lib/partPracticePaths";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import { preloadPartPracticeMedia } from "./preloadPartPracticeMedia";
import { readPartPracticeGroupKey } from "./partPracticePosition";

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
      const groupKey = readPartPracticeGroupKey(
        variables.partNumber,
        variables.mode,
      );
      const media = variables.source.manifest.mediaByGroupId[groupKey ?? ""];
      preloadPartPracticeMedia({
        audioUrl: resolveToeicCatalogMediaUrl(variables.source, media?.audio),
        imageUrl: resolveToeicCatalogMediaUrl(variables.source, media?.image),
      });
      const [run, document] = await Promise.all([runPromise, documentPromise]);
      const session = materializePartPracticeSession(
        document,
        variables.source,
        run,
        variables.mode,
      );
      const groupId = Array.from(session.groupKeyById.entries()).find(
        ([, value]) => value === groupKey,
      )?.[0];
      const group = session.groups.find((candidate) => candidate.id === groupId)
        ?? session.groups[0];
      if (groupKey !== session.groupKeyById.get(group?.id ?? 0)) {
        preloadPartPracticeMedia(group);
      }
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

"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRuntimeTestRun,
} from "@/entities/toeic-runtime/api/runtime";
import {
  getRuntimeTestSessionQueryKey,
  invalidateRuntimeTestPracticeOverview,
} from "@/entities/toeic-runtime/model/cache";
import {
  materializeTestSession,
  type RuntimeTestSessionMode,
} from "@/entities/toeic-runtime/model/materializeTestSession";
import {
  getToeicCatalogDocument,
} from "@/entities/toeic-catalog/api/catalog";
import type { ToeicCatalogSource, ToeicCatalogTest } from "@/entities/toeic-catalog/model/types";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getToeicRunPath } from "@/features/tests/shared/lib/toeicRunPaths";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";

export type StartRuntimeTestRunVariables = {
  test: ToeicCatalogTest;
  source: ToeicCatalogSource;
  partNumbers: number[];
  mode: RuntimeTestSessionMode;
};

type UseStartRuntimeTestRunParams = {
  userId: string | null;
};

export function useStartRuntimeTestRun({ userId }: UseStartRuntimeTestRunParams) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (variables: StartRuntimeTestRunVariables) => {
      const partNumbers = normalizeSelectedParts(variables.partNumbers);
      const requestedParts = variables.test.parts.filter((part) =>
        partNumbers.includes(part.number),
      );
      if (requestedParts.length !== partNumbers.length) {
        throw new Error("Selected test parts are unavailable.");
      }

      const runPromise = runAuthenticatedRequest({
        request: (token) =>
          createRuntimeTestRun(token, {
            testKey: variables.test.id,
            partNumbers,
            mode: variables.mode === "mock_test" ? "mock_test" : "practice",
          }),
      });
      const documentsPromise = Promise.all(
        requestedParts.map(async (part) => ({
          partNumber: part.number,
          document: await getToeicCatalogDocument(variables.source, part.path),
        })),
      );
      const [run, requestedDocuments] = await Promise.all([
        runPromise,
        documentsPromise,
      ]);
      const activeParts = variables.test.parts.filter((part) =>
        run.selectedParts.includes(part.number),
      );
      if (activeParts.length !== run.selectedParts.length) {
        throw new Error("Test session contains unavailable parts.");
      }

      const requestedDocumentByPart = new Map(
        requestedDocuments.map((document) => [document.partNumber, document]),
      );
      const additionalDocuments = await Promise.all(
        activeParts
          .filter((part) => !requestedDocumentByPart.has(part.number))
          .map(async (part) => ({
            partNumber: part.number,
            document: await getToeicCatalogDocument(variables.source, part.path),
          })),
      );
      const documentByPart = new Map(
        [...requestedDocuments, ...additionalDocuments].map((document) => [
          document.partNumber,
          document,
        ]),
      );
      const documents = activeParts.flatMap((part) => {
        const document = documentByPart.get(part.number);
        return document ? [document] : [];
      });

      return materializeTestSession(documents, variables.source, run, variables.mode);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(
        getRuntimeTestSessionQueryKey(session.sessionId, session.mode),
        session,
      );
      if (session.mode !== "mock_test") {
        void invalidateRuntimeTestPracticeOverview(queryClient, userId);
      }
    },
  });

  const startRun = async (variables: StartRuntimeTestRunVariables) => {
    const session = await mutation.mutateAsync(variables);
    router.push(getToeicRunPath(session.sessionId, session.mode, session.partNumbers));
  };

  return {
    startRun,
    isStarting: mutation.isPending,
    startingTestKey: mutation.isPending ? mutation.variables?.test.id ?? null : null,
    startError: toQueryErrorMessage(mutation.error, "Cannot start test."),
    resetStartState: mutation.reset,
  };
}

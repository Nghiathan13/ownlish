"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRuntimeTestRun,
  getRuntimeTestSessionQueryKey,
  invalidateRuntimeTestPracticeOverview,
  restartRuntimeMockRun,
} from "@/entities/toeic-runtime";
import {
  materializeTestSession,
  type RuntimeTestSessionMode,
} from "./session/materializeTestSession";
import {
  getToeicCatalogDocument,
  type ToeicCatalogSource,
  type ToeicCatalogTest,
} from "@/entities/toeic-catalog";
import { runAuthenticatedRequest } from "@/entities/session";
import { getToeicRunPath } from "@/entities/toeic-runtime";
import { normalizeSelectedParts } from "@/entities/toeic-runtime";
import {
  getFirstTestPartGroupKey,
  preloadCatalogGroupMedia,
  preloadFirstTestPartImage,
} from "@/entities/toeic-catalog";
import {
  readTestPracticeGroupKey,
  writeTestPracticeGroupKey,
} from "@/entities/toeic-runtime";
import { toQueryErrorMessage } from "@/shared/lib/toQueryErrorMessage";
import { getLocaleSnapshot } from "@/shared/i18n";
import { translate } from "@/shared/i18n";

export type StartRuntimeTestRunVariables = {
  test: ToeicCatalogTest;
  source: ToeicCatalogSource;
  partNumbers: number[];
  mode: RuntimeTestSessionMode;
  restartMock?: boolean;
  timeLimitMinutes?: number;
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

      const practiceMode = variables.mode === "mock_test" ? null : variables.mode;
      const savedGroupKey = practiceMode
        ? readTestPracticeGroupKey(variables.test.id, practiceMode, partNumbers)
        : null;
      const initialGroupKey = savedGroupKey
        ?? getFirstTestPartGroupKey(variables.test, partNumbers);
      preloadCatalogGroupMedia(variables.source, initialGroupKey);
      if (variables.mode === "mock_test") {
        preloadFirstTestPartImage(
          variables.source,
          variables.test,
          partNumbers,
        );
      }

      const runPromise = runAuthenticatedRequest({
        request: (token) => {
          const input = {
            testKey: variables.test.id,
            partNumbers,
            timeLimitMinutes: variables.timeLimitMinutes,
          };

          return variables.restartMock
            ? restartRuntimeMockRun(token, input)
            : createRuntimeTestRun(token, {
                ...input,
                mode: variables.mode === "mock_test" ? "mock_test" : "practice",
              });
        },
      });
      const documentsPromise = Promise.all(
        requestedParts.map(async (part) => ({
          partNumber: part.number,
          document: await getToeicCatalogDocument(variables.source, part.path),
        })),
      );
      const [run, documents] = await Promise.all([
        runPromise,
        documentsPromise,
      ]);
      if (partNumbers.some((partNumber) => !run.selectedParts.includes(partNumber))) {
        throw new Error("Test session contains unavailable parts.");
      }

      const session = materializeTestSession(
        documents,
        variables.source,
        { ...run, selectedParts: partNumbers },
        variables.mode,
      );
      if (practiceMode && !savedGroupKey && initialGroupKey) {
        writeTestPracticeGroupKey(
          variables.test.id,
          practiceMode,
          partNumbers,
          initialGroupKey,
        );
      }

      return session;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(
        getRuntimeTestSessionQueryKey(
          session.sessionId,
          session.mode,
          session.partNumbers,
        ),
        session,
      );
      if (session.mode !== "mock_test") {
        void invalidateRuntimeTestPracticeOverview(queryClient, userId);
      }
    },
  });

  const startRun = async (variables: StartRuntimeTestRunVariables) => {
    const session = await mutation.mutateAsync(variables);
    router.push(
      getToeicRunPath(
        session.sessionId,
        session.mode,
        session.partNumbers,
        session.testKey,
      ),
    );
  };

  return {
    startRun,
    isStarting: mutation.isPending,
    startingTestKey: mutation.isPending ? mutation.variables?.test.id ?? null : null,
    startError: toQueryErrorMessage(
      mutation.error,
      translate(getLocaleSnapshot(), "tests.cannotStartTest"),
    ),
    resetStartState: mutation.reset,
  };
}

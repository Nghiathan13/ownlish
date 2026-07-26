"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import {
  clearRuntimeTestPracticeRun,
  prepareRuntimeMockRun,
} from "@/entities/toeic-runtime/api/runtime";
import { invalidateRuntimeTestPracticeOverview } from "@/entities/toeic-runtime/model/cache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { useStartRuntimeTestRun } from "@/features/tests/run/model/useStartRuntimeTestRun";
import { clearTestPracticeGroupKeys } from "@/features/tests/shared/model/testPracticePosition";
import {
  materializeCatalogTestSummary,
  type CatalogTestSummary,
} from "@/features/tests/shared/model/catalogTestSummary";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import { getToeicRunPath } from "@/features/tests/shared/lib/toeicRunPaths";
import { useTestPracticeOverviewList } from "./useTestPracticeOverviewList";

type PartPickerIntent = "practice" | "mock";

type PendingMockRun = {
  test: CatalogTestSummary;
  partNumbers: number[];
  timeLimitMinutes: number;
  sessionId: string;
  status: "open" | "pending";
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTestsOverview(
  selectedYear: ToeicYear,
  source: ToeicCatalogSource | undefined,
  catalogError: string | null,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [selectedTest, setSelectedTest] = useState<CatalogTestSummary | null>(
    null,
  );
  const [pendingClearTestKey, setPendingClearTestKey] = useState<string | null>(
    null,
  );
  const [partPickerIntent, setPartPickerIntent] =
    useState<PartPickerIntent>("practice");
  const [pendingMockRun, setPendingMockRun] = useState<PendingMockRun | null>(
    null,
  );
  const progressQuery = useTestPracticeOverviewList({
    isAuthenticated,
    userId: user?.id ?? null,
    source,
  });
  const clearMutation = useMutation({
    mutationFn: (testKey: string) =>
      runAuthenticatedRequest({
        request: (token) => clearRuntimeTestPracticeRun(token, testKey),
      }),
    onSuccess: (_, testKey) => {
      clearTestPracticeGroupKeys(testKey);
      return invalidateRuntimeTestPracticeOverview(queryClient, user?.id ?? null);
    },
  });
  const { startRun, isStarting, startingTestKey } = useStartRuntimeTestRun({
    userId: user?.id ?? null,
  });
  const prepareMockMutation = useMutation({
    mutationFn: ({ test, partNumbers }: Pick<PendingMockRun, "test" | "partNumbers">) =>
      runAuthenticatedRequest({
        request: (token) =>
          prepareRuntimeMockRun(token, {
            testKey: test.catalog.id,
            partNumbers,
          }),
      }),
  });
  const progressByTestKey = new Map(
    progressQuery.progress.map((item) => [item.testKey, item]),
  );
  const tests = (source?.manifest.tests ?? [])
    .filter((test) => test.year === selectedYear)
    .map((test) =>
      materializeCatalogTestSummary(test, progressByTestKey.get(test.id)),
    );

  const requestClearHistory = (testKey: string) => {
    if (!isAuthenticated) {
      return;
    }

    setPendingClearTestKey(testKey);
  };

  const cancelClearHistory = () => {
    if (clearMutation.isPending) {
      return;
    }

    setPendingClearTestKey(null);
  };

  const confirmClearHistory = async () => {
    if (!pendingClearTestKey) {
      return;
    }

    try {
      await clearMutation.mutateAsync(pendingClearTestKey);
      setPendingClearTestKey(null);
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot clear practice history."));
    }
  };

  const startTest = async (
    test: CatalogTestSummary,
    partNumbers: number[],
    mode: PracticeMode,
  ) => {
    const normalizedParts = normalizeSelectedParts(partNumbers);
    if (!isAuthenticated || !source || normalizedParts.length === 0) {
      return;
    }

    try {
      await startRun({
        test: test.catalog,
        source,
        partNumbers: normalizedParts,
        mode,
      });
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start practice."));
    }
  };

  const startMock = async (
    test: CatalogTestSummary,
    partNumbers: number[],
    timeLimitMinutes: number,
  ) => {
    const normalizedParts = normalizeSelectedParts(partNumbers);
    if (!isAuthenticated || !source || normalizedParts.length === 0) {
      return;
    }

    try {
      const preparation = await prepareMockMutation.mutateAsync({
        test,
        partNumbers: normalizedParts,
      });
      if (preparation.status !== "available") {
        setSelectedTest(null);
        setPendingMockRun({
          test,
          partNumbers: preparation.run.selectedParts,
          timeLimitMinutes,
          sessionId: preparation.run.sessionId,
          status: preparation.status,
        });
        return;
      }

      await startRun({
        test: test.catalog,
        source,
        partNumbers: normalizedParts,
        mode: "mock_test",
        timeLimitMinutes,
      });
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start mock test."));
    }
  };

  const continueMock = () => {
    if (!pendingMockRun) {
      return;
    }

    router.push(
      getToeicRunPath(
        pendingMockRun.sessionId,
        "mock_test",
        pendingMockRun.partNumbers,
        pendingMockRun.test.catalog.id,
      ),
    );
    setPendingMockRun(null);
  };

  const restartMock = async () => {
    if (!pendingMockRun || pendingMockRun.status === "pending") {
      return;
    }

    try {
      await startRun({
        test: pendingMockRun.test.catalog,
        source: source!,
        partNumbers: pendingMockRun.partNumbers,
        mode: "mock_test",
        restartMock: true,
        timeLimitMinutes: pendingMockRun.timeLimitMinutes,
      });
      setPendingMockRun(null);
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot restart mock test."));
    }
  };

  const openPartPicker = (test: CatalogTestSummary, intent: PartPickerIntent) => {
    setPartPickerIntent(intent);
    setSelectedTest(test);
  };

  return {
    clearingTestKey: clearMutation.isPending ? clearMutation.variables ?? null : null,
    pendingClearTestKey,
    requestClearHistory,
    cancelClearHistory,
    confirmClearHistory,
    isClearingHistory: clearMutation.isPending,
    isLoadingTests: (!source && !catalogError) || progressQuery.isLoading,
    reloadTests: progressQuery.reload,
    openPartPicker,
    partPickerIntent,
    selectedTest,
    closePartPicker: () => setSelectedTest(null),
    startMock,
    startTest,
    pendingMockRun,
    cancelMockDecision: () => {
      if (!isStarting) {
        setPendingMockRun(null);
      }
    },
    continueMock,
    restartMock,
    startingTestKey: isStarting
      ? startingTestKey
      : prepareMockMutation.isPending
        ? prepareMockMutation.variables?.test.catalog.id ?? null
        : null,
    tests,
    testsError: catalogError ?? progressQuery.error,
  };
}

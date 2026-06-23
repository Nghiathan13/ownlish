"use client";

import { useState } from "react";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import type {
  PracticeMode,
  ToeicTestSummary,
} from "@/entities/toeic/api/types";
import { useTestsList } from "@/features/tests/overview/hooks/useTestsList";
import { useClearToeicPracticeHistory } from "@/features/tests/overview/mutations/hooks/useClearToeicPracticeHistory";
import { useStartToeicRun } from "@/features/tests/overview/mutations/hooks/useStartToeicRun";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";

type PartPickerIntent = "practice" | "mock";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTestsOverview(selectedYear: ToeicYear) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [selectedTest, setSelectedTest] = useState<ToeicTestSummary | null>(
    null,
  );
  const [partPickerIntent, setPartPickerIntent] =
    useState<PartPickerIntent>("practice");

  const { tests, testsError, isLoadingTests, reloadTests } = useTestsList({
    isAuthenticated,
    userId: user?.id ?? null,
    year: selectedYear,
  });

  const {
    clearHistory: clearHistoryMutation,
    isClearing,
    clearingTestId,
  } = useClearToeicPracticeHistory({
    userId: user?.id ?? null,
    year: selectedYear,
  });

  const { startRun, isStarting, startingTestId } = useStartToeicRun();

  const clearHistory = async (testId: number) => {
    if (
      !isAuthenticated ||
      !      window.confirm(
        "Clear all practice answers for this test? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await clearHistoryMutation(testId);
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot clear practice history."));
    }
  };

  const startTest = async (
    testId: number,
    partNumbers: number[],
    mode: PracticeMode,
  ) => {
    const normalizedParts = normalizeSelectedParts(partNumbers);

    if (!isAuthenticated || normalizedParts.length === 0) {
      return;
    }

    try {
      await startRun({
        testId,
        partNumbers: normalizedParts,
        mode,
      });
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start practice."));
    }
  };

  const startMock = async (testId: number, partNumbers: number[]) => {
    const normalizedParts = normalizeSelectedParts(partNumbers);

    if (!isAuthenticated || normalizedParts.length === 0) {
      return;
    }

    try {
      await startRun({
        testId,
        partNumbers: normalizedParts,
        mode: "mock_test",
      });
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start mock test."));
    }
  };

  const openPartPicker = (test: ToeicTestSummary, intent: PartPickerIntent) => {
    setPartPickerIntent(intent);
    setSelectedTest(test);
  };

  const closePartPicker = () => {
    setSelectedTest(null);
  };

  return {
    clearingTestId: isClearing ? clearingTestId : null,
    clearHistory,
    isLoadingTests,
    reloadTests,
    openPartPicker,
    partPickerIntent,
    selectedTest,
    closePartPicker,
    startMock,
    startTest,
    startingTestId: isStarting ? startingTestId : null,
    tests,
    testsError,
  };
}

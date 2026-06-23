"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { clearToeicPracticeHistory } from "@/features/tests/overview/api/clearToeicPracticeHistory";
import type {
  PracticeMode,
  ToeicTestSummary,
} from "@/features/tests/shared/api/types";
import { createToeicRunRequest } from "@/features/tests/run/lib/createToeicRunRequest";
import { getPracticeSessionQueryKey } from "@/features/tests/run/hooks/usePracticeSession";
import { getToeicRunQueryKey } from "@/features/tests/run/hooks/useMockTestRun";
import {
  getTestsQueryKey,
  useTestsList,
} from "@/features/tests/overview/hooks/useTestsList";
import { clearAllPracticeProgressForTest } from "@/features/tests/run/lib/practiceStorage";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";

const TOEIC_PART_COUNT = 7;
const PRACTICE_MODES: PracticeMode[] = ["practice", "review_wrong"];
type PartPickerIntent = "practice" | "mock";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTestsOverview(selectedYear: ToeicYear) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [selectedTest, setSelectedTest] = useState<ToeicTestSummary | null>(
    null,
  );
  const [partPickerIntent, setPartPickerIntent] =
    useState<PartPickerIntent>("practice");
  const [clearingTestId, setClearingTestId] = useState<number | null>(null);
  const [startingTestId, setStartingTestId] = useState<number | null>(null);
  const { tests, testsError, isLoadingTests, reloadTests } = useTestsList({
    isAuthenticated,
    userId: user?.id ?? null,
    year: selectedYear,
  });

  const clearHistory = async (testId: number) => {
    if (
      !isAuthenticated ||
      !window.confirm(
        "Clear all practice history for this test? This cannot be undone.",
      )
    ) {
      return;
    }

    setClearingTestId(testId);
    try {
      await runAuthenticatedRequest({
        request: (token) => clearToeicPracticeHistory(token, testId),
      });
      clearAllPracticeProgressForTest(testId);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getTestsQueryKey(user?.id ?? null, selectedYear),
        }),
        queryClient.invalidateQueries({
          queryKey: ["practice-session", testId],
        }),
        ...Array.from({ length: TOEIC_PART_COUNT }, (_, index) =>
          PRACTICE_MODES.map((mode) =>
            queryClient.invalidateQueries({
              queryKey: getPracticeSessionQueryKey(testId, index + 1, mode),
            }),
          ),
        ).flat(),
      ]);
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot clear practice history."));
    } finally {
      setClearingTestId(null);
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

    setStartingTestId(testId);
    try {
      const session = await runAuthenticatedRequest({
        request: (token) =>
          createToeicRunRequest({
            token,
            testId,
            partNumbers: normalizedParts,
            mode,
          }),
      });

      queryClient.setQueryData(
        getPracticeSessionQueryKey(testId, normalizedParts, mode),
        session,
      );

      router.push(
        `/tests/${testId}/${mode}?parts=${normalizedParts.join(",")}&year=${selectedYear}`,
      );
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start practice."));
    } finally {
      setStartingTestId(null);
    }
  };

  const openPartPicker = (test: ToeicTestSummary, intent: PartPickerIntent) => {
    setPartPickerIntent(intent);
    setSelectedTest(test);
  };

  const closePartPicker = () => {
    setSelectedTest(null);
  };

  const startMock = async (testId: number, partNumbers: number[]) => {
    const normalizedParts = normalizeSelectedParts(partNumbers);

    if (!isAuthenticated || normalizedParts.length === 0) {
      return;
    }

    setStartingTestId(testId);
    try {
      const session = await runAuthenticatedRequest({
        request: (token) =>
          createToeicRunRequest({
            token,
            testId,
            partNumbers: normalizedParts,
            mode: "mock_test",
          }),
      });

      queryClient.setQueryData(getToeicRunQueryKey(session.sessionId), session);
      router.push(
        `/tests/${testId}/mock_test/${session.sessionId}?year=${selectedYear}`,
      );
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start mock test."));
    } finally {
      setStartingTestId(null);
    }
  };

  return {
    clearingTestId,
    clearHistory,
    isLoadingTests,
    reloadTests,
    openPartPicker,
    partPickerIntent,
    selectedTest,
    closePartPicker,
    startMock,
    startTest,
    startingTestId,
    tests,
    testsError,
  };
}

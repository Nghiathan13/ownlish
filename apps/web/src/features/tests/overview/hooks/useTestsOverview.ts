"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { clearToeicPracticeHistory } from "@/features/tests/overview/api/clearToeicPracticeHistory";
import type {
  PracticeMode,
  ToeicTestSummary,
} from "@/features/tests/shared/api/types";
import { getPracticeSessionQueryKey } from "@/features/tests/run/hooks/usePracticeSession";
import {
  getTestsQueryKey,
  useTestsList,
} from "@/features/tests/overview/hooks/useTestsList";
import { clearAllPracticeProgressForTest } from "@/features/tests/run/lib/practiceStorage";

const TOEIC_PART_COUNT = 7;
const PRACTICE_MODES: PracticeMode[] = ["practice", "review_wrong"];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTestsOverview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [selectedTest, setSelectedTest] = useState<ToeicTestSummary | null>(
    null,
  );
  const [clearingTestId, setClearingTestId] = useState<number | null>(null);
  const [startingTestId, setStartingTestId] = useState<number | null>(null);
  const { tests, testsError, isLoadingTests, reloadTests } = useTestsList({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });

  const clearHistory = async (testId: number) => {
    if (
      !accessToken ||
      !window.confirm(
        "Clear all practice history for this test? This cannot be undone.",
      )
    ) {
      return;
    }

    setClearingTestId(testId);
    try {
      await runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => clearToeicPracticeHistory(token, testId),
      });
      clearAllPracticeProgressForTest(testId);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getTestsQueryKey(user?.id ?? null, 2026),
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

  const startTest = (
    testId: number,
    partNumbers: number[],
    mode: PracticeMode,
  ) => {
    if (partNumbers.length === 0) {
      return;
    }

    setStartingTestId(testId);
    router.push(`/tests/${testId}/${mode}?parts=${partNumbers.join(",")}`);
    setSelectedTest(null);
    setStartingTestId(null);
  };

  return {
    clearingTestId,
    clearHistory,
    isLoadingTests,
    reloadTests,
    selectedTest,
    selectTest: setSelectedTest,
    startTest,
    startingTestId,
    tests,
    testsError,
  };
}

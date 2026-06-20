"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { clearToeicPracticeHistory } from "@/features/tests/api/clearToeicPracticeHistory";
import type { PracticeMode } from "@/features/tests/api/types";
import { PartPickerModal } from "@/features/tests/components/overview/PartPickerModal";
import { TestCard } from "@/features/tests/components/overview/TestCard";
import { getPracticeSessionQueryKey } from "@/features/tests/hooks/usePracticeSession";
import { getTestsQueryKey, useTestsList } from "@/features/tests/hooks/useTestsList";
import { clearAllPracticeProgressForTest } from "@/features/tests/lib/practiceStorage";
import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/lib/toeicParts";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import type { ToeicTestSummary } from "@/features/tests/api/types";

const TOEIC_PART_COUNT = 7;
const PRACTICE_MODES: PracticeMode[] = ["practice", "review_wrong"];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [selectedTest, setSelectedTest] = useState<ToeicTestSummary | null>(
    null,
  );
  const [clearingTestId, setClearingTestId] = useState<number | null>(null);
  const [startingMultiTestId, setStartingMultiTestId] = useState<number | null>(
    null,
  );
  const { tests, testsError, isLoadingTests, reloadTests } = useTestsList({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });

  const handleClearHistory = async (testId: number) => {
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

  const handleStart = (
    testId: number,
    partNumbers: number[],
    mode: PracticeMode,
  ) => {
    if (partNumbers.length === 0) {
      return;
    }

    setStartingMultiTestId(testId);

    router.push(`/tests/${testId}/${mode}?parts=${partNumbers.join(",")}`);
    setSelectedTest(null);
    setStartingMultiTestId(null);
  };

  return (
    <PageShell>
      <div className="flex flex-col items-start gap-2 p-4">
        <button
          className="rounded-lg border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background"
          type="button"
        >
          TOEIC
        </button>
        <button
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
          type="button"
        >
          2026
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {isLoadingTests ? (
          <p className="text-muted-foreground">Loading tests...</p>
        ) : testsError ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">{testsError}</p>
            <Button onClick={() => void reloadTests()} type="button" variant="secondary">
              Retry
            </Button>
          </div>
        ) : tests.length === 0 ? (
          <p className="text-muted-foreground">No tests available yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <TestCard
                isClearingHistory={clearingTestId === test.id}
                key={test.id}
                onClearHistory={() => void handleClearHistory(test.id)}
                onPractice={() => setSelectedTest(test)}
                onReviewWrong={() =>
                  handleStart(test.id, [...ALL_TOEIC_PART_NUMBERS], "review_wrong")
                }
                test={test}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTest ? (
        <PartPickerModal
          isStarting={startingMultiTestId === selectedTest.id}
          onClose={() => setSelectedTest(null)}
          onStart={(partNumbers, mode) => {
            handleStart(selectedTest.id, partNumbers, mode);
          }}
          test={selectedTest}
          testLabel={`Test ${selectedTest.id}`}
        />
      ) : null}
    </PageShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import {
  clearTestPracticeHistory,
  getPracticeStats,
} from "@/features/tests/api/testsApi";
import type { PracticeMode } from "@/features/tests/api/types";
import { PartPickerModal } from "@/features/tests/components/PartPickerModal";
import { TestCard } from "@/features/tests/components/TestCard";
import {
  getPracticeSessionQueryKey,
} from "@/features/tests/hooks/usePracticeSession";
import { getPracticeStatsQueryKey } from "@/features/tests/hooks/usePracticeStats";
import { useTestsList } from "@/features/tests/hooks/useTestsList";
import { clearAllPracticeProgressForTest } from "@/features/tests/lib/practiceStorage";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import type { ToeicTestSummary } from "@/features/tests/api/types";

const TOEIC_PART_COUNT = 7;
const PRACTICE_MODES: PracticeMode[] = ["normal", "wrong_questions"];

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
  const { tests, testsError, isLoadingTests, reloadTests } = useTestsList({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });

  const statsQueries = useQueries({
    queries: tests.map((test) => ({
      queryKey: getPracticeStatsQueryKey(test.id),
      queryFn: () =>
        runAuthenticatedRequest({
          accessToken,
          clearSession,
          request: (token) => getPracticeStats(token, test.id),
        }),
      enabled: status === "authenticated" && Boolean(accessToken),
      staleTime: 30_000,
    })),
  });

  const selectedTestStats = selectedTest
    ? (statsQueries.find((_, index) => tests[index]?.id === selectedTest.id)
        ?.data ?? null)
    : null;

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
        request: (token) => clearTestPracticeHistory(token, testId),
      });
      clearAllPracticeProgressForTest(testId);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getPracticeStatsQueryKey(testId),
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

  return (
    <PageShell>
      <Panel>
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-foreground bg-foreground px-3.5 py-2 text-sm font-semibold text-background"
            type="button"
          >
            TOEIC
          </button>
          <button
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground"
            type="button"
          >
            2026
          </button>
        </div>

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
            {tests.map((test, index) => (
              <TestCard
                isClearingHistory={clearingTestId === test.id}
                isLoadingStats={statsQueries[index]?.isLoading ?? false}
                key={test.id}
                onClearHistory={() => void handleClearHistory(test.id)}
                onPractice={() => setSelectedTest(test)}
                stats={statsQueries[index]?.data ?? null}
                test={test}
              />
            ))}
          </div>
        )}
      </Panel>

      {selectedTest ? (
        <PartPickerModal
          onClose={() => setSelectedTest(null)}
          onStart={(partNumber, mode) => {
            const query =
              mode === "wrong_questions" ? "?mode=wrong_questions" : "";
            router.push(
              `/tests/${selectedTest.id}/part/${partNumber}${query}`,
            );
            setSelectedTest(null);
          }}
          stats={selectedTestStats}
          testLabel={selectedTest.label}
        />
      ) : null}
    </PageShell>
  );
}

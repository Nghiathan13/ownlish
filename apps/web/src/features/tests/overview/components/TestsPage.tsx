"use client";

import { PartPickerModal } from "@/features/tests/overview/components/PartPickerModal";
import { TestCard } from "@/features/tests/overview/components/TestCard";
import { useTestsOverview } from "@/features/tests/overview/hooks/useTestsOverview";
import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";

export function TestsPage() {
  const overview = useTestsOverview();
  const selectedTest = overview.selectedTest;

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
        {overview.isLoadingTests ? (
          <p className="text-muted-foreground">Loading tests...</p>
        ) : overview.testsError ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">{overview.testsError}</p>
            <Button
              onClick={() => void overview.reloadTests()}
              type="button"
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        ) : overview.tests.length === 0 ? (
          <p className="text-muted-foreground">No tests available yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overview.tests.map((test) => (
              <TestCard
                isClearingHistory={overview.clearingTestId === test.id}
                key={test.id}
                onClearHistory={() => void overview.clearHistory(test.id)}
                onPractice={() => overview.selectTest(test)}
                onReviewWrong={() =>
                  overview.startTest(
                    test.id,
                    [...ALL_TOEIC_PART_NUMBERS],
                    "review_wrong",
                  )
                }
                test={test}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTest ? (
        <PartPickerModal
          isStarting={overview.startingTestId === selectedTest.id}
          onClose={() => overview.selectTest(null)}
          onStart={(partNumbers, mode) => {
            overview.startTest(selectedTest.id, partNumbers, mode);
          }}
          test={selectedTest}
          testLabel={`Test ${selectedTest.id}`}
        />
      ) : null}
    </PageShell>
  );
}

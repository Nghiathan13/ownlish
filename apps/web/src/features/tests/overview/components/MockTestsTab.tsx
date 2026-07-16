"use client";

import { ToeicPartPickerModal } from "@/features/tests/shared/components/ToeicPartPickerModal";
import { TestCard } from "@/features/tests/overview/components/TestCard";
import { useTestsOverview } from "@/features/tests/overview/hooks/useTestsOverview";
import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import { testOverviewCardGridClassName } from "@/features/tests/overview/lib/testOverviewCard";
import { MockTestsTabSkeleton } from "@/features/tests/overview/components/MockTestsTabSkeleton";
import { ToeicYearTabs } from "@/features/tests/overview/components/ToeicYearTabs";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type MockTestsTabProps = {
  availableYears: ToeicYear[];
  selectedYear: ToeicYear;
};

export function MockTestsTab({
  availableYears,
  selectedYear,
}: MockTestsTabProps) {
  const overview = useTestsOverview(selectedYear);
  const selectedTest = overview.selectedTest;

  return (
    <>
      <ToeicYearTabs
        availableYears={availableYears}
        selectedYear={selectedYear}
      />

      <div className="mb-4 flex flex-col gap-4 px-8 lg:px-16">
        {overview.isLoadingTests ? (
          <MockTestsTabSkeleton />
        ) : overview.testsError ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">{overview.testsError}</p>
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => void overview.reloadTests()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : overview.tests.length === 0 ? (
          <p className="text-muted-foreground">
            No tests available for this year yet.
          </p>
        ) : (
          <div className={testOverviewCardGridClassName}>
            {overview.tests.map((test) => (
              <TestCard
                isClearingHistory={overview.clearingTestId === test.id}
                key={test.id}
                onClearHistory={() => void overview.clearHistory(test.id)}
                onMock={() => overview.openPartPicker(test, "mock")}
                onPractice={() => overview.openPartPicker(test, "practice")}
                onReviewWrong={() =>
                  void overview.startTest(
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
        <ToeicPartPickerModal
          intent={overview.partPickerIntent}
          isStarting={overview.startingTestId === selectedTest.id}
          onClose={overview.closePartPicker}
          onStart={(partNumbers, mode) => {
            void overview.startTest(selectedTest.id, partNumbers, mode);
          }}
          onStartMock={(partNumbers) => {
            void overview.startMock(selectedTest.id, partNumbers);
          }}
          test={selectedTest}
          testLabel={`Test ${selectedTest.id}`}
        />
      ) : null}
    </>
  );
}

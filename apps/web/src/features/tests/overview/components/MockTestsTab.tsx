"use client";

import { ToeicPartPickerModal } from "@/features/tests/shared/components/ToeicPartPickerModal";
import { ClearHistoryConfirmModal } from "@/features/tests/overview/components/ClearHistoryConfirmModal";
import { TestCard } from "@/features/tests/overview/components/TestCard";
import { useTestsOverview } from "@/features/tests/overview/hooks/useTestsOverview";
import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import { testOverviewCardGridClassName } from "@/features/tests/overview/lib/testOverviewCard";
import { MockTestsTabSkeleton } from "@/features/tests/overview/components/MockTestsTabSkeleton";
import { ToeicYearTabs } from "@/features/tests/overview/components/ToeicYearTabs";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import { formatCatalogTestLabel } from "@/features/tests/shared/model/catalogTestSummary";
import { useT } from "@/shared/providers/LocaleProvider";

type MockTestsTabProps = {
  availableYears: ToeicYear[];
  selectedYear: ToeicYear;
  source: ToeicCatalogSource | undefined;
  catalogError: string | null;
};

export function MockTestsTab({
  availableYears,
  selectedYear,
  source,
  catalogError,
}: MockTestsTabProps) {
  const t = useT();
  const overview = useTestsOverview(selectedYear, source, catalogError);
  const selectedTest = overview.selectedTest;

  return (
    <>
      <ToeicYearTabs
        availableYears={availableYears}
        selectedYear={selectedYear}
      />

      <div className="mb-4 flex flex-col gap-4 px-4 lg:px-16">
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
              {t("tests.retry")}
            </button>
          </div>
        ) : overview.tests.length === 0 ? (
          <p className="text-muted-foreground">{t("tests.noTestsForYear")}</p>
        ) : (
          <div className={testOverviewCardGridClassName}>
            {overview.tests.map((test) => (
              <TestCard
                isClearingHistory={overview.clearingTestKey === test.catalog.id}
                key={test.catalog.id}
                onClearHistory={() =>
                  overview.requestClearHistory(test.catalog.id)
                }
                onMock={() => overview.openPartPicker(test, "mock")}
                onPractice={() => overview.openPartPicker(test, "practice")}
                onReviewWrong={() =>
                  void overview.startTest(
                    test,
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
          isStarting={overview.startingTestKey === selectedTest.catalog.id}
          onClose={overview.closePartPicker}
          onStart={(partNumbers, mode) => {
            void overview.startTest(selectedTest, partNumbers, mode);
          }}
          onStartMock={(partNumbers) => {
            void overview.startMock(selectedTest, partNumbers);
          }}
          test={selectedTest}
          testLabel={formatCatalogTestLabel(selectedTest)}
        />
      ) : null}

      {overview.pendingClearTestKey ? (
        <ClearHistoryConfirmModal
          isConfirming={overview.isClearingHistory}
          onClose={overview.cancelClearHistory}
          onConfirm={() => void overview.confirmClearHistory()}
          subtitle={t("tests.clearHistorySubtitle")}
          title={t("tests.clearHistoryTitle")}
        />
      ) : null}
    </>
  );
}

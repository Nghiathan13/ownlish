"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToeicPartPickerModal } from "./ToeicPartPickerModal";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { TestCard } from "./TestCard";
import { useTestsOverview } from "@/_pages/tests/model/overview/hooks/useTestsOverview";
import { ALL_TOEIC_PART_NUMBERS } from "@/entities/toeic-runtime";
import type { ToeicYear } from "@/entities/toeic-runtime";
import { testOverviewCardGridClassName } from "@/_pages/tests/lib/overview/testOverviewCard";
import { MockTestsTabSkeleton } from "./MockTestsTabSkeleton";
import { ToeicYearTabs } from "./ToeicYearTabs";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import {
  formatCatalogTestLabel,
  type CatalogTestSummary,
} from "@/_pages/tests/model/overview/catalogTestSummary";
import { useT } from "@/shared/lib/providers";
import { MockTestHistoryPanel } from "./MockTestHistoryPanel";
import { MockRunDecisionModal } from "./MockRunDecisionModal";
import { getToeicRunPath } from "@/entities/toeic-runtime";

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
  const router = useRouter();
  const overview = useTestsOverview(selectedYear, source, catalogError);
  const selectedTest = overview.selectedTest;
  const [historyTest, setHistoryTest] = useState<CatalogTestSummary | null>(null);

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
                onMockHistory={() => setHistoryTest(test)}
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
          onStartMock={(partNumbers, timeLimitMinutes) => {
            void overview.startMock(selectedTest, partNumbers, timeLimitMinutes);
          }}
          test={selectedTest}
          testLabel={formatCatalogTestLabel(selectedTest)}
        />
      ) : null}

      {overview.pendingClearTestKey ? (
        <ConfirmModal
          isConfirming={overview.isClearingHistory}
          onClose={overview.cancelClearHistory}
          onConfirm={() => void overview.confirmClearHistory()}
          subtitle={t("tests.clearHistorySubtitle")}
          title={t("tests.clearHistoryTitle")}
        />
      ) : null}

      {historyTest ? (
        <MockTestHistoryPanel
          onClose={() => setHistoryTest(null)}
          onViewResult={(sessionId, selectedParts) => {
            router.push(
              getToeicRunPath(
                sessionId,
                "mock_test",
                selectedParts,
                historyTest.catalog.id,
              ),
            );
          }}
          testKey={historyTest.catalog.id}
        />
      ) : null}

      {overview.pendingMockRun ? (
        <MockRunDecisionModal
          isRestarting={overview.startingTestKey !== null}
          onClose={overview.cancelMockDecision}
          onContinue={overview.continueMock}
          onRestart={() => void overview.restartMock()}
          parts={overview.pendingMockRun.partNumbers}
          status={overview.pendingMockRun.status}
        />
      ) : null}
    </>
  );
}

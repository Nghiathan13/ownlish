"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_TOEIC_PART_NUMBERS } from "@/entities/toeic-runtime";
import type { ToeicYear } from "@/entities/toeic-runtime";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { useT } from "@/shared/lib/providers";
import { getToeicRunPath } from "@/entities/toeic-runtime";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import {
  formatCatalogTestLabel,
  type CatalogTestSummary,
} from "../model/catalogTestSummary";
import { useTestsOverview } from "../model/useTestsOverview";
import { MockRunDecisionModal } from "./MockRunDecisionModal";
import { MockTestHistoryPanel } from "./MockTestHistoryPanel";
import { MockTestsTabSkeleton } from "./MockTestsTabSkeleton";
import { TestCard } from "./TestCard";
import { ToeicPartPickerModal } from "./ToeicPartPickerModal";

type MockTestsCardsProps = {
  selectedYear: ToeicYear;
};

export function MockTestsCards({ selectedYear }: MockTestsCardsProps) {
  const t = useT();
  const router = useRouter();
  const overview = useTestsOverview(selectedYear);
  const selectedTest = overview.selectedTest;
  const [historyTest, setHistoryTest] = useState<CatalogTestSummary | null>(null);

  return (
    <>
      {overview.isLoadingTests ? (
        <MockTestsTabSkeleton />
      ) : overview.testsError ? (
        <div className="col-span-full space-y-3">
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
        <p className="col-span-full text-muted-foreground">
          {t("tests.noTestsForYear")}
        </p>
      ) : (
        overview.tests.map((test) => (
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
        ))
      )}

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

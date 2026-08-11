"use client";

import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { PartPracticeCard } from "./PartPracticeCard";
import { PartPracticeTabs } from "./PartPracticeTabs";
import { PracticeTabSkeleton } from "./PracticeTabSkeleton";
import { usePartPracticeOverview } from "@/_pages/tests/model/overview/hooks/usePartPracticeOverview";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import type { PartPracticePartSummary } from "@/entities/toeic-runtime";
import { useT } from "@/shared/lib/providers";

function buildPartSummary(
  summaries: PartPracticePartSummary[],
  partNumber: number,
): PartPracticePartSummary {
  return (
    summaries.find((summary) => summary.partNumber === partNumber) ?? {
      partNumber,
      total: 0,
      answered: 0,
      correct: 0,
      wrong: 0,
    }
  );
}

export function PracticeTab() {
  const t = useT();
  const overview = usePartPracticeOverview();
  const selectedSummary = buildPartSummary(
    overview.summaries,
    overview.selectedPartNumber,
  );

  return (
    <>
      <PartPracticeTabs
        partNumbers={overview.allPartNumbers}
        selectedPartNumber={overview.selectedPartNumber}
      />

      <div className="mb-4 flex flex-col gap-4 px-4 lg:px-16">
        {overview.isLoading ? (
          <PracticeTabSkeleton includePartTabs={false} />
        ) : overview.error ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">{overview.error}</p>
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => void overview.reload()}
              type="button"
            >
              {t("tests.retry")}
            </button>
          </div>
        ) : (
          <div className="max-w-md">
            <PartPracticeCard
              isClearingHistory={
                overview.isClearing &&
                overview.clearingPartNumber === overview.selectedPartNumber
              }
              isStarting={
                overview.isStarting &&
                overview.startingPartNumber === overview.selectedPartNumber
              }
              onClearHistory={() =>
                overview.requestClearHistory(overview.selectedPartNumber)
              }
              onPractice={() =>
                void overview.startPartPractice(
                  overview.selectedPartNumber,
                  "practice",
                )
              }
              onReviewWrong={() =>
                void overview.startPartPractice(
                  overview.selectedPartNumber,
                  "review_wrong",
                )
              }
              summary={selectedSummary}
            />
          </div>
        )}
      </div>

      {overview.pendingClearPartNumber != null ? (
        <ConfirmModal
          isConfirming={overview.isClearing}
          onClose={overview.cancelClearHistory}
          onConfirm={() => void overview.confirmClearHistory()}
          subtitle={t("tests.clearHistorySubtitle")}
          title={t("tests.clearHistoryTitle")}
        />
      ) : null}
    </>
  );
}

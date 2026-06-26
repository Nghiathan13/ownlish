"use client";

import { PartPracticeCard } from "@/features/tests/overview/components/PartPracticeCard";
import { usePartPracticeOverview } from "@/features/tests/overview/hooks/usePartPracticeOverview";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";

export function PracticeTab() {
  const overview = usePartPracticeOverview();
  const selectedSummary =
    overview.summaries.find(
      (summary) => summary.partNumber === overview.selectedPartNumber,
    ) ?? {
      partNumber: overview.selectedPartNumber,
      total: 0,
      answered: 0,
      correct: 0,
      wrong: 0,
    };

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-wrap gap-2">
        {overview.allPartNumbers.map((partNumber) => {
          const isSelected = overview.selectedPartNumber === partNumber;

          return (
            <button
              className={classNames(
                isSelected
                  ? primaryTextButtonClassName()
                  : secondaryTextButtonClassName(),
              )}
              key={partNumber}
              onClick={() => overview.setSelectedPartNumber(partNumber)}
              type="button"
            >
              Part {partNumber}
            </button>
          );
        })}
      </div>

      {overview.isLoading ? (
        <p className="text-muted-foreground">Loading part practice...</p>
      ) : overview.error ? (
        <div className="space-y-3">
          <p className="text-muted-foreground">{overview.error}</p>
          <button
            className={secondaryTextButtonClassName()}
            onClick={() => void overview.reload()}
            type="button"
          >
            Retry
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
              void overview.clearHistory(overview.selectedPartNumber)
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
  );
}

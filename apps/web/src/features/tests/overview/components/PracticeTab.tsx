"use client";

import Link from "next/link";
import { PartPracticeCard } from "@/features/tests/overview/components/PartPracticeCard";
import { PracticeTabSkeleton } from "@/features/tests/overview/components/PracticeTabSkeleton";
import { usePartPracticeOverview } from "@/features/tests/overview/hooks/usePartPracticeOverview";
import { getTestsOverviewPath } from "@/features/tests/shared/lib/partPracticePaths";
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
            <Link
              aria-current={isSelected ? "page" : undefined}
              className={classNames(
                isSelected
                  ? primaryTextButtonClassName()
                  : secondaryTextButtonClassName(),
              )}
              href={getTestsOverviewPath({
                tab: "part_practice",
                part: partNumber,
              })}
              key={partNumber}
              scroll={false}
            >
              Part {partNumber}
            </Link>
          );
        })}
      </div>

      {overview.isLoading ? (
        <PracticeTabSkeleton includePartPills={false} />
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

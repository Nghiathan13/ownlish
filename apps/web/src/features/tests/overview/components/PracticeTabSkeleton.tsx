import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { PartPracticeTabsSkeleton } from "@/features/tests/overview/components/PartPracticeTabsSkeleton";
import {
  testOverviewCardGridClassName,
  testOverviewCardSkeletonClassName,
} from "@/features/tests/overview/lib/testOverviewCard";
import { SkeletonCardGrid } from "@/shared/skeletons/SkeletonCardGrid";

type PracticeTabSkeletonProps = {
  includePartTabs?: boolean;
};

export function PracticeTabSkeleton({
  includePartTabs = false,
}: PracticeTabSkeletonProps) {
  return (
    <>
      {includePartTabs ? <PartPracticeTabsSkeleton /> : null}
      <SkeletonCardGrid
        cardClassName={testOverviewCardSkeletonClassName}
        cardCount={ALL_TOEIC_PART_NUMBERS.length}
        className={
          includePartTabs
            ? "mb-4 grid gap-4 px-16 sm:grid-cols-2 xl:grid-cols-4"
            : testOverviewCardGridClassName
        }
      />
    </>
  );
}

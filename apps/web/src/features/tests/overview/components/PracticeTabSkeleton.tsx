import { PartPracticeTabsSkeleton } from "@/features/tests/overview/components/PartPracticeTabsSkeleton";
import { testOverviewCardClassName } from "@/features/tests/overview/lib/testOverviewCard";
import { Skeleton } from "@/shared/ui/Skeleton";

type PracticeTabSkeletonProps = {
  includePartTabs?: boolean;
};

function PartPracticeCardSkeleton() {
  return (
    <div className="max-w-md">
      <div className={testOverviewCardClassName}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="size-10 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function PracticeTabSkeleton({
  includePartTabs = false,
}: PracticeTabSkeletonProps) {
  const cardSkeleton = <PartPracticeCardSkeleton />;

  if (!includePartTabs) {
    return cardSkeleton;
  }

  return (
    <>
      <PartPracticeTabsSkeleton />
      <div aria-hidden className="mb-4 flex flex-col gap-4 px-4 lg:px-16">
        {cardSkeleton}
      </div>
    </>
  );
}

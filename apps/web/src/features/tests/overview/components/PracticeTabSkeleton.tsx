import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";
import { Skeleton } from "@/shared/ui/Skeleton";

type PracticeTabSkeletonProps = {
  includePartPills?: boolean;
};

function PartPracticeCardSkeleton() {
  return (
    <div className="max-w-md">
      <div className="flex flex-col gap-4 rounded-xl bg-surface p-4">
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
  includePartPills = true,
}: PracticeTabSkeletonProps) {
  if (!includePartPills) {
    return <PartPracticeCardSkeleton />;
  }

  return (
    <div aria-hidden className="flex flex-col gap-4 px-4">
      <SkeletonTabPills
        className="flex flex-wrap gap-2 px-0"
        count={ALL_TOEIC_PART_NUMBERS.length}
        pillClassName="h-10 w-16"
      />

      <PartPracticeCardSkeleton />
    </div>
  );
}

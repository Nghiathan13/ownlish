import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";
import { Skeleton } from "@/shared/ui/Skeleton";

export function ToeicYearTabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden className="mb-8 flex flex-col items-start gap-2 px-16">
      <Skeleton className="h-10 w-20 rounded-lg" />
      <SkeletonTabPills
        className="flex flex-wrap gap-2 rounded-[16px] bg-surface p-2 shadow-card"
        count={count}
        pillClassName="h-10 w-16"
      />
    </div>
  );
}

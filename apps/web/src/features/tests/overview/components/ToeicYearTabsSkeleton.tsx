import { TOEIC_YEARS } from "@/features/tests/shared/constants/toeicYears";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";
import { Skeleton } from "@/shared/ui/Skeleton";

export function ToeicYearTabsSkeleton() {
  return (
    <div aria-hidden className="mb-4 flex flex-col items-start gap-2 px-4">
      <Skeleton className="h-10 w-20 rounded-lg" />
      <SkeletonTabPills
        className="flex flex-wrap gap-2 px-0"
        count={TOEIC_YEARS.length}
        pillClassName="h-10 w-16"
      />
    </div>
  );
}

import { TOEIC_YEARS } from "@/features/tests/shared/constants/toeicYears";
import { Skeleton } from "@/shared/ui/Skeleton";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function ToeicYearTabsSkeleton({
  count = TOEIC_YEARS.length,
}: {
  count?: number;
}) {
  return (
    <>
      <div aria-hidden className="mx-4 my-4 lg:hidden">
        <Skeleton className="h-10 w-[200px] rounded-lg" />
      </div>
      <SkeletonTabPills
        className="mx-4 my-4 hidden w-fit gap-2 rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border lg:mx-16 lg:my-8 lg:flex"
        count={count}
        pillClassName="h-9 w-24 rounded-lg"
      />
    </>
  );
}

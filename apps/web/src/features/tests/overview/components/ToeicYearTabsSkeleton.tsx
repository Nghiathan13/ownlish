import { TOEIC_YEARS } from "@/features/tests/shared/constants/toeicYears";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function ToeicYearTabsSkeleton({
  count = TOEIC_YEARS.length,
}: {
  count?: number;
}) {
  return (
    <SkeletonTabPills
      className="mx-8 mt-8 mb-8 flex w-fit flex-wrap gap-2 rounded-[16px] bg-surface p-2 shadow-card lg:mx-16 lg:mt-16"
      count={count}
      pillClassName="h-9 w-24 rounded-lg"
    />
  );
}

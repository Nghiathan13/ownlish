import { TOEIC_YEARS } from "@/features/tests/shared/constants/toeicYears";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function ToeicYearTabsSkeleton({
  count = TOEIC_YEARS.length,
}: {
  count?: number;
}) {
  return (
    <SkeletonTabPills
      className="mx-4 my-6 flex w-fit max-w-[calc(100%-2rem)] gap-3 overflow-x-auto lg:mx-16 lg:max-w-[calc(100%-8rem)]"
      count={count}
      pillClassName="h-8 w-24 rounded-lg"
    />
  );
}

import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function PartPracticeTabsSkeleton({
  count = ALL_TOEIC_PART_NUMBERS.length,
}: {
  count?: number;
}) {
  return (
    <SkeletonTabPills
      className="mx-4 my-6 flex w-fit max-w-[calc(100%-2rem)] gap-3 overflow-x-auto lg:mx-16 lg:max-w-[calc(100%-8rem)]"
      count={count}
      pillClassName="h-8 w-16 rounded-lg"
    />
  );
}

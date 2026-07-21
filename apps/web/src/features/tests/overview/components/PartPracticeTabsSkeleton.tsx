import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function PartPracticeTabsSkeleton({
  count = ALL_TOEIC_PART_NUMBERS.length,
}: {
  count?: number;
}) {
  return (
    <SkeletonTabPills
      className="mx-8 mt-8 mb-8 grid w-fit grid-cols-4 gap-2 rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border lg:mx-16 lg:mt-16"
      count={count}
      pillClassName="h-10 w-16"
    />
  );
}

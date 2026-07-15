import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function PartPracticeTabsSkeleton({
  count = ALL_TOEIC_PART_NUMBERS.length,
}: {
  count?: number;
}) {
  return (
    <SkeletonTabPills
      className="mx-16 mb-16 flex flex-wrap gap-2 rounded-[16px] bg-surface p-2 shadow-card"
      count={count}
      pillClassName="h-10 w-16"
    />
  );
}

import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function ToeicYearTabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonTabPills
      className="mx-16 mb-16 flex flex-wrap gap-2 rounded-[16px] bg-surface p-2 shadow-card"
      count={count}
      pillClassName="h-10 w-16"
    />
  );
}

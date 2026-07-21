import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";

export function ToeicYearTabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonTabPills
      className="mx-8 mt-8 mb-8 w-fit gap-2 rounded-[16px] bg-surface p-2 shadow-card lg:mx-16 lg:mt-16"
      count={count}
      pillClassName="h-10 w-16"
    />
  );
}

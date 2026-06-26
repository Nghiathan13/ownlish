import { ToeicYearTabsSkeleton } from "@/features/tests/overview/components/ToeicYearTabsSkeleton";
import { SkeletonCardGrid } from "@/shared/skeletons/SkeletonCardGrid";

type MockTestsTabSkeletonProps = {
  includeYearTabs?: boolean;
};

export function MockTestsTabSkeleton({
  includeYearTabs = false,
}: MockTestsTabSkeletonProps) {
  return (
    <>
      {includeYearTabs ? <ToeicYearTabsSkeleton /> : null}
      <SkeletonCardGrid
        className={
          includeYearTabs
            ? undefined
            : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        }
      />
    </>
  );
}

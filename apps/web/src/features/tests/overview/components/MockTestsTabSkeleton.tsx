import { ToeicYearTabsSkeleton } from "@/features/tests/overview/components/ToeicYearTabsSkeleton";
import { testOverviewCardGridClassName } from "@/features/tests/overview/lib/testOverviewCard";
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
            : testOverviewCardGridClassName
        }
      />
    </>
  );
}

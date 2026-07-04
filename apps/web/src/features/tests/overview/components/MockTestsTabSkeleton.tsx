import { ToeicYearTabsSkeleton } from "@/features/tests/overview/components/ToeicYearTabsSkeleton";
import { testOverviewCardGridClassName, testOverviewCardSkeletonClassName } from "@/features/tests/overview/lib/testOverviewCard";
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
        cardClassName={testOverviewCardSkeletonClassName}
        className={
          includeYearTabs
            ? undefined
            : testOverviewCardGridClassName
        }
      />
    </>
  );
}

import { ToeicYearTabsSkeleton } from "./ToeicYearTabsSkeleton";
import { testOverviewCardGridClassName, testOverviewCardSkeletonClassName } from "@/_pages/tests/lib/overview/testOverviewCard";
import { SkeletonCardGrid } from "@/shared/skeletons";

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
            ? "mb-4 grid gap-4 px-4 lg:px-16 sm:grid-cols-2 xl:grid-cols-4"
            : testOverviewCardGridClassName
        }
      />
    </>
  );
}

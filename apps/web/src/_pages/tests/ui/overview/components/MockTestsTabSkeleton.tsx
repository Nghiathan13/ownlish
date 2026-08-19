import { testOverviewCardGridClassName, testOverviewCardSkeletonClassName } from "@/_pages/tests/lib/overview/testOverviewCard";
import { SkeletonCardGrid } from "@/shared/skeletons";

export function MockTestsTabSkeleton() {
  return (
    <SkeletonCardGrid
      cardClassName={testOverviewCardSkeletonClassName}
      className={testOverviewCardGridClassName}
    />
  );
}

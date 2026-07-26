import { MockTestsTabSkeleton } from "@/features/tests/overview/components/MockTestsTabSkeleton";
import { PracticeTabSkeleton } from "@/features/tests/overview/components/PracticeTabSkeleton";
import { TestsOverviewTabsSkeleton } from "@/features/tests/overview/components/TestsOverviewTabsSkeleton";
import { type ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import type { TestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PageShell } from "@/shared/ui/PageShell";

type TestsOverviewPageSkeletonProps = {
  selectedTab?: TestsOverviewTab;
  selectedYear?: ToeicYear;
};

function TestsOverviewNeutralBodySkeleton() {
  return (
    <div aria-hidden className="px-4">
      <Skeleton className="h-40 max-w-md rounded-xl" />
    </div>
  );
}

export function TestsOverviewPageSkeleton({
  selectedTab,
}: TestsOverviewPageSkeletonProps) {
  return (
    <PageShell>
      <TestsOverviewTabsSkeleton />
      {selectedTab === "part_practice" ? (
        <PracticeTabSkeleton includePartTabs />
      ) : selectedTab === "mock_tests" ? (
        <MockTestsTabSkeleton includeYearTabs />
      ) : (
        <TestsOverviewNeutralBodySkeleton />
      )}
    </PageShell>
  );
}


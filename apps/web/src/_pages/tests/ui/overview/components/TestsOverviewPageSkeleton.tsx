import { MockTestsTabSkeleton } from "./MockTestsTabSkeleton";
import { PracticeTabSkeleton } from "./PracticeTabSkeleton";
import { TestsOverviewTabsSkeleton } from "./TestsOverviewTabsSkeleton";
import { type ToeicYear } from "@/entities/toeic-runtime";
import type { TestsOverviewTab } from "@/entities/toeic-runtime";
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

import { MockTestsTabSkeleton } from "@/features/tests/overview/components/MockTestsTabSkeleton";
import { PracticeTabSkeleton } from "@/features/tests/overview/components/PracticeTabSkeleton";
import { TestsOverviewTabs } from "@/features/tests/overview/components/TestsOverviewTabs";
import {
  DEFAULT_TOEIC_YEAR,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import type { TestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import { SkeletonTabPills } from "@/shared/skeletons/SkeletonTabPills";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PageShell } from "@/shared/ui/PageShell";

type TestsOverviewPageSkeletonProps = {
  selectedTab?: TestsOverviewTab;
  selectedYear?: ToeicYear;
};

function TestsOverviewTabsSkeleton() {
  return (
    <SkeletonTabPills
      className="mb-4 flex flex-wrap items-center gap-2 px-16"
      count={2}
      pillClassName="h-10 w-28"
    />
  );
}

function TestsOverviewNeutralBodySkeleton() {
  return (
    <div aria-hidden className="px-4">
      <Skeleton className="h-40 max-w-md rounded-xl" />
    </div>
  );
}

export function TestsOverviewPageSkeleton({
  selectedTab,
  selectedYear = DEFAULT_TOEIC_YEAR,
}: TestsOverviewPageSkeletonProps) {
  return (
    <PageShell>
      {selectedTab != null ? (
        <TestsOverviewTabs
          mockYear={selectedYear}
          partNumber={selectedTab === "part_practice" ? 1 : null}
          selectedTab={selectedTab}
        />
      ) : (
        <TestsOverviewTabsSkeleton />
      )}

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

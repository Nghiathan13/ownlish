"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MockTestsTab } from "@/features/tests/overview/components/MockTestsTab";
import { PracticeTab } from "@/features/tests/overview/components/PracticeTab";
import { TestsOverviewPageSkeleton } from "@/features/tests/overview/components/TestsOverviewPageSkeleton";
import {
  TestsOverviewTabs,
  parseTestsOverviewTab,
} from "@/features/tests/overview/components/TestsOverviewTabs";
import type { TestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import {
  DEFAULT_TOEIC_YEAR,
  parseToeicYearParam,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import { getTestsOverviewRedirectTarget } from "@/features/tests/shared/lib/partPracticePaths";
import { PageShell } from "@/shared/ui/PageShell";

function TestsPageContent({
  selectedYear,
  selectedTab,
}: {
  selectedYear: ToeicYear;
  selectedTab: TestsOverviewTab;
}) {
  return (
    <PageShell>
      <TestsOverviewTabs selectedTab={selectedTab} selectedYear={selectedYear} />
      {selectedTab === "part_practice" ? (
        <PracticeTab />
      ) : (
        <MockTestsTab selectedYear={selectedYear} />
      )}
    </PageShell>
  );
}

export function TestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const selectedYear: ToeicYear =
    parseToeicYearParam(yearParam) ?? DEFAULT_TOEIC_YEAR;
  const selectedTab = parseTestsOverviewTab(searchParams.get("tab"));
  const redirectTarget = getTestsOverviewRedirectTarget(searchParams);

  useEffect(() => {
    if (redirectTarget) {
      router.replace(redirectTarget, { scroll: false });
    }
  }, [redirectTarget, router]);

  if (redirectTarget) {
    return (
      <TestsOverviewPageSkeleton
        selectedTab={selectedTab}
        selectedYear={selectedYear}
      />
    );
  }

  return (
    <TestsPageContent
      key={`${selectedYear}-${selectedTab}`}
      selectedTab={selectedTab}
      selectedYear={selectedYear}
    />
  );
}

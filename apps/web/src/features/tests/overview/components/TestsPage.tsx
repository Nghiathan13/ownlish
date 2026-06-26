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
import {
  DEFAULT_TOEIC_YEAR,
  parseToeicYearParam,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import {
  getTestsOverviewRedirectTarget,
  parsePracticeOverviewPartParam,
} from "@/features/tests/shared/lib/partPracticePaths";
import { PageShell } from "@/shared/ui/PageShell";

export function TestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const selectedYear: ToeicYear =
    parseToeicYearParam(yearParam) ?? DEFAULT_TOEIC_YEAR;
  const selectedTab = parseTestsOverviewTab(searchParams.get("tab"));
  const selectedPartNumber = parsePracticeOverviewPartParam(
    searchParams.get("part"),
  );
  const redirectTarget = getTestsOverviewRedirectTarget(searchParams);
  const mockYearForLinks = selectedYear;
  const partForLinks = selectedPartNumber ?? 1;

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
    <PageShell>
      <TestsOverviewTabs
        mockYear={mockYearForLinks}
        partNumber={partForLinks}
        selectedTab={selectedTab}
      />
      {selectedTab === "part_practice" ? (
        <PracticeTab />
      ) : (
        <MockTestsTab selectedYear={selectedYear} />
      )}
    </PageShell>
  );
}

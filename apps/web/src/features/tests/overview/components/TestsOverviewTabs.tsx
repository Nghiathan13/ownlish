"use client";

import Link from "next/link";
import type { TestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import {
  getTestsOverviewPath,
  parseTestsOverviewTab,
} from "@/features/tests/shared/lib/partPracticePaths";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type TestsOverviewTabsProps = {
  mockYear: ToeicYear;
  partNumber: number | null;
  selectedTab: TestsOverviewTab;
};

export function TestsOverviewTabs({
  mockYear,
  partNumber,
  selectedTab,
}: TestsOverviewTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 px-4">
      <Link
        aria-current={selectedTab === "mock_tests" ? "page" : undefined}
        className={
          selectedTab === "mock_tests"
            ? primaryTextButtonClassName()
            : secondaryTextButtonClassName()
        }
        href={getTestsOverviewPath({ year: mockYear, tab: "mock_tests" })}
        scroll={false}
      >
        Mock Tests
      </Link>
      <Link
        aria-current={selectedTab === "part_practice" ? "page" : undefined}
        className={
          selectedTab === "part_practice"
            ? primaryTextButtonClassName()
            : secondaryTextButtonClassName()
        }
        href={getTestsOverviewPath({
          tab: "part_practice",
          part: partNumber ?? undefined,
        })}
        scroll={false}
      >
        Part Practice
      </Link>
    </div>
  );
}

export { parseTestsOverviewTab };

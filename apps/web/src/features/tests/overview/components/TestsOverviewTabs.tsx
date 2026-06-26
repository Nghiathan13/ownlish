"use client";

import Link from "next/link";
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
  selectedYear: ToeicYear;
  selectedTab: "mock" | "practice";
};

export function TestsOverviewTabs({
  selectedYear,
  selectedTab,
}: TestsOverviewTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 px-4">
      <Link
        aria-current={selectedTab === "mock" ? "page" : undefined}
        className={
          selectedTab === "mock"
            ? primaryTextButtonClassName()
            : secondaryTextButtonClassName()
        }
        href={getTestsOverviewPath({ year: selectedYear, tab: "mock" })}
        scroll={false}
      >
        Mock Tests
      </Link>
      <Link
        aria-current={selectedTab === "practice" ? "page" : undefined}
        className={
          selectedTab === "practice"
            ? primaryTextButtonClassName()
            : secondaryTextButtonClassName()
        }
        href={getTestsOverviewPath({ tab: "practice" })}
        scroll={false}
      >
        Practice
      </Link>
    </div>
  );
}

export { parseTestsOverviewTab };

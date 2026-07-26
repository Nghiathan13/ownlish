"use client";

import Link from "next/link";
import {
  getTestsListPath,
  getToeicYearButtonLabel,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import { classNames } from "@/shared/lib/classNames";

const toeicYearButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getToeicYearButtonClassName(isActive: boolean) {
  return classNames(
    toeicYearButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-[#f0f0f0] text-foreground hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
  );
}

type ToeicYearTabsProps = {
  availableYears: ToeicYear[];
  selectedYear: ToeicYear;
};

export function ToeicYearTabs({
  availableYears,
  selectedYear,
}: ToeicYearTabsProps) {
  if (availableYears.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 my-6 flex w-fit max-w-[calc(100%-2rem)] gap-3 overflow-x-auto lg:mx-16 lg:max-w-[calc(100%-8rem)]">
      {availableYears.map((year) => {
        const isActive = selectedYear === year;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={getToeicYearButtonClassName(isActive)}
            href={getTestsListPath(year)}
            key={year}
            scroll={false}
          >
            {getToeicYearButtonLabel(year)}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { getTestsOverviewPath } from "@/features/tests/shared/lib/partPracticePaths";
import { classNames } from "@/shared/lib/classNames";

const partTabButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-[15px] leading-[20px] font-normal";

function getPartTabButtonClassName(isActive: boolean) {
  return classNames(
    partTabButtonClassName,
    isActive
      ? "bg-foreground text-background"
      : "bg-transparent text-foreground hover:bg-hover-overlay",
  );
}

type PartPracticeTabsProps = {
  partNumbers: number[];
  selectedPartNumber: number;
};

export function PartPracticeTabs({
  partNumbers,
  selectedPartNumber,
}: PartPracticeTabsProps) {
  if (partNumbers.length === 0) {
    return null;
  }

  return (
    <div className="mx-8 mt-8 mb-8 w-fit gap-2 rounded-[16px] bg-surface p-2 shadow-card lg:mx-16 lg:mt-16">
      {partNumbers.map((partNumber) => {
        const isActive = selectedPartNumber === partNumber;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={getPartTabButtonClassName(isActive)}
            href={getTestsOverviewPath({
              tab: "part_practice",
              part: partNumber,
            })}
            key={partNumber}
            scroll={false}
          >
            Part {partNumber}
          </Link>
        );
      })}
    </div>
  );
}

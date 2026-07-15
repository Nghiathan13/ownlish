"use client";

import Link from "next/link";
import { getTestsOverviewPath } from "@/features/tests/shared/lib/partPracticePaths";
import { primaryTextButtonClassName } from "@/shared/ui/button";
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
    <div className="mb-8 flex flex-col items-start gap-2 px-16">
      <button className={primaryTextButtonClassName()} type="button">
        TOEIC
      </button>
      <div className="flex flex-wrap gap-2 rounded-[16px] bg-surface p-2 shadow-card">
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
    </div>
  );
}

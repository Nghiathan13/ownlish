"use client";

import Link from "next/link";
import { getTestsOverviewPath } from "@/entities/toeic-runtime";
import { formatMessage } from "@/shared/i18n";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/lib/providers";

const partTabButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getPartTabButtonClassName(isActive: boolean) {
  return classNames(
    partTabButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-surface-subtle text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
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
  const t = useT();

  if (partNumbers.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 my-6 flex w-fit max-w-[calc(100%-2rem)] gap-3 overflow-x-auto lg:mx-16 lg:max-w-[calc(100%-8rem)]">
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
            {formatMessage(t("tests.partNumber"), { number: partNumber })}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getTestsListPath,
  getToeicYearButtonLabel,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import { classNames } from "@/shared/lib/classNames";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

const toeicYearButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-[15px] leading-[20px] font-normal";

function getToeicYearButtonClassName(isActive: boolean) {
  return classNames(
    toeicYearButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-transparent text-foreground hover:bg-hover-overlay",
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
  const router = useRouter();

  if (availableYears.length === 0) {
    return null;
  }

  const yearOptions = availableYears.map((year) => ({
    label: getToeicYearButtonLabel(year),
    value: year,
  }));

  return (
    <>
      <div className="mx-4 my-4 lg:hidden">
        <SelectDropdown
          ariaLabel="Year"
          className="w-[200px]"
          onChange={(year) => {
            router.push(getTestsListPath(year), { scroll: false });
          }}
          options={yearOptions}
          value={selectedYear}
        />
      </div>

      <div className="mx-4 my-4 hidden w-fit gap-2 rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border lg:mx-16 lg:my-8 lg:flex">
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
    </>
  );
}

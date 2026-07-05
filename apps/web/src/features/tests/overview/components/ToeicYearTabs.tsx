import Link from "next/link";
import {
  getTestsListPath,
  getToeicYearButtonLabel,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";

const toeicYearButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-base font-normal";

function getToeicYearButtonClassName(isActive: boolean) {
  return classNames(
    toeicYearButtonClassName,
    isActive
      ? "bg-foreground text-background"
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
  if (availableYears.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-col items-start gap-2 px-16">
      <button className={primaryTextButtonClassName()} type="button">
        TOEIC
      </button>
      <div className="flex flex-wrap gap-2 bg-surface p-2">
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
    </div>
  );
}

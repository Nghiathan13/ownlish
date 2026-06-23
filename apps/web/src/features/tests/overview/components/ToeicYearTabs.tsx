import Link from "next/link";
import {
  getTestsListPath,
  getToeicYearButtonLabel,
  TOEIC_YEARS,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type ToeicYearTabsProps = {
  selectedYear: ToeicYear;
};

export function ToeicYearTabs({ selectedYear }: ToeicYearTabsProps) {
  return (
    <div className="mb-4 flex flex-col items-start gap-2 px-4">
      <button className={primaryTextButtonClassName()} type="button">
        TOEIC
      </button>
      <div className="flex flex-wrap gap-2">
        {TOEIC_YEARS.map((year) => (
          <Link
            aria-current={selectedYear === year ? "page" : undefined}
            className={
              selectedYear === year
                ? primaryTextButtonClassName()
                : secondaryTextButtonClassName()
            }
            href={getTestsListPath(year)}
            key={year}
            scroll={false}
          >
            {getToeicYearButtonLabel(year)}
          </Link>
        ))}
      </div>
    </div>
  );
}

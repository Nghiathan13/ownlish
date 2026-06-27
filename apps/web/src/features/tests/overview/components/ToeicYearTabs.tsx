import Link from "next/link";
import {
  getTestsListPath,
  getToeicYearButtonLabel,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

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
    <div className="mb-4 flex flex-col items-start gap-2 px-4">
      <button className={primaryTextButtonClassName()} type="button">
        TOEIC
      </button>
      <div className="flex flex-wrap gap-2">
        {availableYears.map((year) => (
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

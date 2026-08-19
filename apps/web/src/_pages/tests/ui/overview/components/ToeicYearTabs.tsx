"use client";

import {
  getTestsListPath,
  getToeicYearButtonLabel,
  TOEIC_YEARS,
  type ToeicYear,
} from "@/entities/toeic-runtime";
import { PillTabs } from "@/shared/ui/pill-tabs";

type ToeicYearTabsProps = {
  selectedYear: ToeicYear;
};

export function ToeicYearTabs({ selectedYear }: ToeicYearTabsProps) {
  return (
    <PillTabs
      activeKey={String(selectedYear)}
      ariaLabel="TOEIC year"
      className="mx-4 my-6 max-w-[calc(100%-2rem)] shrink-0 lg:mx-16 lg:max-w-[calc(100%-8rem)]"
      items={TOEIC_YEARS.map((year) => ({
        href: getTestsListPath(year),
        key: String(year),
        label: getToeicYearButtonLabel(year),
      }))}
    />
  );
}

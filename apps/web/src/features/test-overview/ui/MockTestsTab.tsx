"use client";

import {
  getTestsListPath,
  getToeicYearButtonLabel,
  TOEIC_YEARS,
} from "@/entities/toeic-runtime";
import { PillTabs } from "@/shared/ui/pill-tabs";

type MockTestsTabProps = {
  selectedYear: (typeof TOEIC_YEARS)[number];
};

export function MockTestsTab({ selectedYear }: MockTestsTabProps) {
  return (
    <PillTabs
      activeKey={String(selectedYear)}
      ariaLabel="TOEIC year"
      items={TOEIC_YEARS.map((year) => ({
        href: getTestsListPath(year),
        key: String(year),
        label: getToeicYearButtonLabel(year),
      }))}
    />
  );
}

"use client";

import {
  ALL_TOEIC_PART_NUMBERS,
  getTestsOverviewPath,
} from "@/entities/toeic-runtime";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { PillTabs } from "@/shared/ui/pill-tabs";

type PartPracticeTabsProps = {
  selectedPartNumber: (typeof ALL_TOEIC_PART_NUMBERS)[number];
};

export function PartPracticeTabs({
  selectedPartNumber,
}: PartPracticeTabsProps) {
  const t = useT();

  return (
    <PillTabs
      activeKey={String(selectedPartNumber)}
      ariaLabel={t("nav.partPractice")}
      items={ALL_TOEIC_PART_NUMBERS.map((partNumber) => ({
        href: getTestsOverviewPath({
          tab: "part_practice",
          part: partNumber,
        }),
        key: String(partNumber),
        label: formatMessage(t("tests.partNumber"), { number: partNumber }),
      }))}
    />
  );
}

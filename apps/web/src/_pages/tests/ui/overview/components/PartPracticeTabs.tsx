"use client";

import { getTestsOverviewPath } from "@/entities/toeic-runtime";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { PillTabs } from "@/shared/ui/pill-tabs";

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
    <PillTabs
      activeKey={String(selectedPartNumber)}
      ariaLabel={t("nav.partPractice")}
      className="mx-4 my-6 max-w-[calc(100%-2rem)] shrink-0 lg:mx-16 lg:max-w-[calc(100%-8rem)]"
      items={partNumbers.map((partNumber) => ({
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

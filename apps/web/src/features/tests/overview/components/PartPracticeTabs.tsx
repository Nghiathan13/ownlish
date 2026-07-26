"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTestsOverviewPath } from "@/features/tests/shared/lib/partPracticePaths";
import { formatMessage } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

const partTabButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-[15px] leading-[20px] font-normal";

function getPartTabButtonClassName(isActive: boolean) {
  return classNames(
    partTabButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
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
  const t = useT();
  const router = useRouter();

  if (partNumbers.length === 0) {
    return null;
  }

  const partOptions = partNumbers.map((partNumber) => ({
    label: formatMessage(t("tests.partNumber"), { number: partNumber }),
    value: partNumber,
  }));

  return (
    <>
      <div className="mx-4 my-4 lg:hidden">
        <SelectDropdown
          ariaLabel="Part"
          className="w-[200px]"
          onChange={(partNumber) => {
            router.push(
              getTestsOverviewPath({
                tab: "part_practice",
                part: partNumber,
              }),
              { scroll: false },
            );
          }}
          options={partOptions}
          value={selectedPartNumber}
        />
      </div>

      <div className="mx-4 my-4 hidden w-fit gap-2 rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border lg:mx-16 lg:my-8 lg:flex">
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
    </>
  );
}

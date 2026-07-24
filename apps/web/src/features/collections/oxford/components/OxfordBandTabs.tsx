"use client";

import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";
import {
  getOxfordPath,
  OXFORD_BANDS,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { shouldHandleOxfordNavigation } from "@/features/collections/oxford/model/useOxfordNavigation";
import { useT } from "@/shared/providers/LocaleProvider";

type OxfordBandTabsProps = {
  activeBand: OxfordBand;
  getHref?: (band: OxfordBand) => string;
  onSelectBand?: (band: OxfordBand) => void;
};

export function OxfordBandTabs({
  activeBand,
  getHref = getOxfordPath,
  onSelectBand,
}: OxfordBandTabsProps) {
  const t = useT();

  return (
    <nav
      aria-label={t("collections.oxfordCefrLevels")}
      className="flex w-fit gap-1 rounded-lg bg-surface p-1 shadow-card dark:border dark:border-border"
    >
      {OXFORD_BANDS.map((band) => {
        const isActive = band === activeBand;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={classNames(
              "inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-[15px] leading-[20px] font-normal",
              isActive
                ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
                : "text-foreground hover:bg-hover-overlay",
            )}
            href={getHref(band)}
            key={band}
            onClick={
              onSelectBand
                ? (event) => {
                    if (!shouldHandleOxfordNavigation(event)) {
                      return;
                    }

                    event.preventDefault();
                    onSelectBand(band);
                  }
                : undefined
            }
            prefetch={false}
            scroll={false}
          >
            {band}
          </Link>
        );
      })}
    </nav>
  );
}

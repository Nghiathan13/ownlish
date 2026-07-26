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

const oxfordBandButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getOxfordBandButtonClassName(isActive: boolean) {
  return classNames(
    oxfordBandButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-[#f0f0f0] text-foreground hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
  );
}

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
      className="flex w-fit max-w-full gap-3 overflow-x-auto"
    >
      {OXFORD_BANDS.map((band) => {
        const isActive = band === activeBand;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={getOxfordBandButtonClassName(isActive)}
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

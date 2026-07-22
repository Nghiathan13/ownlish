import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";
import {
  getOxfordPath,
  OXFORD_BANDS,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";

type OxfordBandTabsProps = {
  activeBand: OxfordBand;
};

export function OxfordBandTabs({ activeBand }: OxfordBandTabsProps) {
  return (
    <nav
      aria-label="Oxford CEFR levels"
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
                ? "bg-foreground text-background"
                : "text-foreground hover:bg-hover-overlay",
            )}
            href={getOxfordPath(band)}
            key={band}
            scroll={false}
          >
            {band}
          </Link>
        );
      })}
    </nav>
  );
}

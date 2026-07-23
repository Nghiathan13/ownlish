import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";
import {
  getOxfordPath,
  OXFORD_BANDS,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { shouldHandleOxfordNavigation } from "@/features/collections/oxford/model/useOxfordNavigation";

type OxfordBandTabsProps = {
  activeBand: OxfordBand;
  onSelectBand: (band: OxfordBand) => void;
};

export function OxfordBandTabs({ activeBand, onSelectBand }: OxfordBandTabsProps) {
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
                ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
                : "text-foreground hover:bg-hover-overlay",
            )}
            href={getOxfordPath(band)}
            key={band}
            onClick={(event) => {
              if (!shouldHandleOxfordNavigation(event)) {
                return;
              }

              event.preventDefault();
              onSelectBand(band);
            }}
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

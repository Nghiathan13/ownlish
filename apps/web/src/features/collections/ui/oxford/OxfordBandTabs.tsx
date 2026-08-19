"use client";

import {
  getOxfordPath,
  OXFORD_BANDS,
  type OxfordBand,
} from "@/entities/collection";
import { useT } from "@/shared/lib/providers";
import { PillTabs } from "@/shared/ui/pill-tabs";

type OxfordBandTabsProps = {
  activeBand: OxfordBand;
  getHref?: (band: OxfordBand) => string;
};

export function OxfordBandTabs({
  activeBand,
  getHref = getOxfordPath,
}: OxfordBandTabsProps) {
  const t = useT();

  return (
    <PillTabs
      activeKey={activeBand}
      ariaLabel={t("collections.oxfordCefrLevels")}
      items={OXFORD_BANDS.map((band) => ({
        href: getHref(band),
        key: band,
        label: band,
      }))}
    />
  );
}

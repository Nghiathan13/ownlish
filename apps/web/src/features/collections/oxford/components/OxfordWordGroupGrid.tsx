"use client";

import Link from "next/link";
import {
  getOxfordGroupRange,
  getOxfordPath,
  OXFORD_GROUP_SIZE,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { shouldHandleOxfordNavigation } from "@/features/collections/oxford/model/useOxfordNavigation";
import {
  collectionListCardClassName,
  collectionListCardGridClassName,
} from "@/features/collections/shared/lib/collectionListCard";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { StartIcon } from "@/shared/ui/icons/StartIcon";

type OxfordWordGroupGridProps = {
  band: OxfordBand;
  itemCount: number;
  onOpenPart: (part: number) => void;
};

export function OxfordWordGroupGrid({
  band,
  itemCount,
  onOpenPart,
}: OxfordWordGroupGridProps) {
  const t = useT();
  const groupCount = Math.ceil(itemCount / OXFORD_GROUP_SIZE);

  return (
    <div className={`${collectionListCardGridClassName} mb-8`}>
      {Array.from({ length: groupCount }, (_, index) => {
        const group = index + 1;
        const range = getOxfordGroupRange(group, itemCount);
        const partTitle = formatMessage(t("collections.partTitle"), {
          band,
          group,
        });

        return (
          <article
            className={`${collectionListCardClassName} min-w-[300px]`}
            key={group}
          >
            <Link
              aria-label={formatMessage(t("collections.openPart"), {
                band,
                group,
              })}
              className="absolute inset-0 rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              href={getOxfordPath(band, group)}
              onClick={(event) => {
                if (!shouldHandleOxfordNavigation(event)) {
                  return;
                }

                event.preventDefault();
                onOpenPart(group);
              }}
              prefetch={false}
            />
            <div className="pointer-events-none relative">
              <h2 className="text-lg font-semibold">{partTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {range.wordCount} {t("collections.words")}
              </p>
            </div>
            <Link
              className={iconTextButtonClassName(
                "relative z-10 w-full border-border bg-transparent text-foreground hover:bg-hover-overlay",
              )}
              href={`/review/oxford/${band}/part-${group}`}
              prefetch={false}
            >
              <StartIcon />
              {t("collections.review")}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { OxfordPartProgress } from "@/entities/collection/api/collections";
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
  partProgress: OxfordPartProgress[];
  onOpenPart: (part: number) => void;
};

export function OxfordWordGroupGrid({
  band,
  itemCount,
  partProgress,
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
        const progress = partProgress[group - 1] ?? {
          masteredCount: 0,
          learningCount: 0,
          newCount: range.wordCount,
        };
        const masteredWidth = (progress.masteredCount / range.wordCount) * 100;
        const learningWidth = (progress.learningCount / range.wordCount) * 100;

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
              <div className="mt-3 flex items-center gap-4 text-sm tabular-nums">
                <span className="text-warning">
                  {progress.masteredCount} {t("collections.mastered")}
                </span>
                <span className="text-primary">
                  {progress.learningCount} {t("collections.learning")}
                </span>
                <span className="text-muted-foreground">
                  {progress.newCount} {t("collections.new")}
                </span>
              </div>
              <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="bg-warning"
                  style={{ width: `${masteredWidth}%` }}
                />
                <span
                  className="bg-primary"
                  style={{ width: `${learningWidth}%` }}
                />
                <span className="flex-1 bg-muted-foreground/35" />
              </div>
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

"use client";

import Link from "next/link";
import type { OxfordPartProgress } from "@/entities/collection";
import {
  getOxfordGroupRange,
  getOxfordPath,
  OXFORD_GROUP_SIZE,
  type OxfordBand,
} from "@/entities/collection";
import { shouldHandleOxfordNavigation } from "@/features/collections";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { StartIcon } from "@/shared/ui/icons";

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
    <div className="mb-8 grid gap-4 px-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] lg:px-16">
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
            className="group relative flex min-w-[300px] flex-col gap-4 rounded-card border border-border bg-surface-card p-4 hover:border-primary"
            key={group}
          >
            <Link
              aria-label={formatMessage(t("collections.openPart"), {
                band,
                group,
              })}
              className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
                <span className="text-status-mastered">
                  {progress.masteredCount} {t("collections.mastered")}
                </span>
                <span className="text-primary">
                  {progress.learningCount} {t("collections.learning")}
                </span>
                <span className="text-muted-foreground">
                  {progress.newCount} {t("collections.new")}
                </span>
              </div>
              <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-muted-background">
                <span
                  className="bg-status-mastered"
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

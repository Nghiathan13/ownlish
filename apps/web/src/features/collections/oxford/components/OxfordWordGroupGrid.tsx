import Link from "next/link";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  getOxfordGroupRange,
  getOxfordPath,
  OXFORD_GROUP_SIZE,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { StartIcon } from "@/shared/ui/icons/StartIcon";

type OxfordWordGroupGridProps = {
  band: OxfordBand;
  collection: CollectionSummary;
};

export function OxfordWordGroupGrid({
  band,
  collection,
}: OxfordWordGroupGridProps) {
  const groupCount = Math.ceil(collection.itemCount / OXFORD_GROUP_SIZE);

  return (
    <div className="mb-8 grid gap-4 px-4 sm:grid-cols-2 sm:px-16 xl:grid-cols-4">
      {Array.from({ length: groupCount }, (_, index) => {
        const group = index + 1;
        const range = getOxfordGroupRange(group, collection.itemCount);

        return (
          <article
            className="relative flex min-w-[300px] flex-col gap-4 rounded-[16px] bg-surface p-4 shadow-card dark:border dark:border-border"
            key={group}
          >
            <Link
              aria-label={`Open ${band} - Part ${group}`}
              className="absolute inset-0 rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              href={getOxfordPath(band, group)}
            />
            <div className="pointer-events-none relative">
              <h2 className="text-lg font-semibold">
                {band} - Part {group}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {range.wordCount} words
              </p>
            </div>
            <button
              className={iconTextButtonClassName(
                "relative z-10 w-full border-border bg-transparent text-foreground hover:bg-hover-overlay",
              )}
              type="button"
            >
              <StartIcon />
              Review
            </button>
          </article>
        );
      })}
    </div>
  );
}

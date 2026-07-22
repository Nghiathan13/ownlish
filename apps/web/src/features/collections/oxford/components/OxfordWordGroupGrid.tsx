import Link from "next/link";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  getOxfordGroupRange,
  getOxfordPath,
  OXFORD_GROUP_SIZE,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";

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
          <Link
            className="group rounded-xl bg-surface p-4 shadow-card transition hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] dark:border dark:border-border"
            href={getOxfordPath(band, group)}
            key={group}
          >
            <p className="text-sm text-muted-foreground">Oxford {band}</p>
            <h2 className="mt-2 text-xl font-semibold">Words {range.label}</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              {range.wordCount} words
            </p>
          </Link>
        );
      })}
    </div>
  );
}

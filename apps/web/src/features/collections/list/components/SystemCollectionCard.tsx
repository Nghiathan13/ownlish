import Link from "next/link";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";

type SystemCollectionCardProps = {
  collection: CollectionSummary;
};

export function SystemCollectionCard({ collection }: SystemCollectionCardProps) {
  return (
    <Link
      className="block rounded-xl border border-border p-4 hover:bg-muted"
      href={getCollectionPath(collection)}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold">{collection.name}</h2>
        {collection.cefrLevel ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
            {collection.cefrLevel}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-sm font-semibold">{collection.itemCount} words</p>
    </Link>
  );
}

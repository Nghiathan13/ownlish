import type { CollectionSummary } from "@/entities/collection/api/collections";
import { SystemCollectionCard } from "@/features/collections/list/components/SystemCollectionCard";

type SystemCollectionsGridProps = {
  collections: CollectionSummary[];
};

export function SystemCollectionsGrid({ collections }: SystemCollectionsGridProps) {
  return (
    <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3">
      {collections.map((collection) => (
        <SystemCollectionCard collection={collection} key={collection.id} />
      ))}
    </div>
  );
}

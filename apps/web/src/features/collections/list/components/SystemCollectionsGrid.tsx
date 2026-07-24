import type { CollectionSummary } from "@/entities/collection/api/collections";
import { SystemCollectionCard } from "@/features/collections/list/components/SystemCollectionCard";

type SystemCollectionsGridProps = {
  canImport: boolean;
  collections: CollectionSummary[];
  importError: string | null;
  importingCollectionId: string | null;
  onImportCollection: (collectionId: string) => void;
};

export function SystemCollectionsGrid({
  canImport,
  collections,
  importError,
  importingCollectionId,
  onImportCollection,
}: SystemCollectionsGridProps) {
  return (
    <>
      {importError ? (
        <p className="mb-4 px-4 text-sm text-danger lg:px-16">{importError}</p>
      ) : null}
      <div className="mb-8 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4 lg:px-16">
        {collections.map((collection) => (
          <SystemCollectionCard
            canImport={canImport}
            collection={collection}
            isImporting={importingCollectionId === collection.id}
            key={collection.id}
            onImport={onImportCollection}
          />
        ))}
      </div>
    </>
  );
}

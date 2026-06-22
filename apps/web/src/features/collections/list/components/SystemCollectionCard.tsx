import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { SystemCollectionImportButton } from "@/features/collections/list/components/SystemCollectionImportButton";

type SystemCollectionCardProps = {
  collection: CollectionSummary;
  canImport: boolean;
  isImporting: boolean;
  onImport: (collectionId: string) => void;
};

export function SystemCollectionCard({
  collection,
  canImport,
  isImporting,
  onImport,
}: SystemCollectionCardProps) {
  return (
    <CollectionCard
      badge={collection.cefrLevel}
      footerAction={
        canImport
          ? (
            <SystemCollectionImportButton
              isImporting={isImporting}
              onImport={() => onImport(collection.id)}
            />
          )
          : null
      }
      href={getCollectionPath(collection)}
      title={collection.name}
      wordCountLabel={`${collection.itemCount} words`}
    />
  );
}

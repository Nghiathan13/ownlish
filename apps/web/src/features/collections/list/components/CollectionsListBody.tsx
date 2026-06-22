import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CollectionCategoryEmptyState } from "@/features/collections/list/components/CollectionCategoryEmptyState";
import { CollectionsGridSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import { SystemCollectionsGrid } from "@/features/collections/list/components/SystemCollectionsGrid";
import { UserCollectionsGrid } from "@/features/collections/list/components/UserCollectionsGrid";

type CollectionsListBodyProps = {
  activeCollections: CollectionSummary[];
  activeTabLabel: string;
  canImportSystemCollections: boolean;
  collectionsError: string | null;
  defaultCollection: CollectionSummary | null;
  deleteError: string | null;
  deletingCollectionId: string | null;
  importError: string | null;
  importingCollectionId: string | null;
  isAuthenticated: boolean;
  isLoadingCollections: boolean;
  isUserTab: boolean;
  onCreateCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
  onImportSystemCollection: (collectionId: string) => void;
  onRetry: () => void;
  userId: string | null;
};

export function CollectionsListBody({
  activeCollections,
  activeTabLabel,
  canImportSystemCollections,
  collectionsError,
  defaultCollection,
  deleteError,
  deletingCollectionId,
  importError,
  importingCollectionId,
  isAuthenticated,
  isLoadingCollections,
  isUserTab,
  onCreateCollection,
  onDeleteCollection,
  onImportSystemCollection,
  onRetry,
  userId,
}: CollectionsListBodyProps) {
  if (isLoadingCollections) {
    return <CollectionsGridSkeleton />;
  }

  if (collectionsError) {
    return (
      <div className="px-4">
        <CollectionsRetryPanel message={collectionsError} onRetry={onRetry} />
      </div>
    );
  }

  if (isUserTab) {
    return (
      <UserCollectionsGrid
        collections={activeCollections}
        defaultCollection={defaultCollection}
        deleteError={deleteError}
        deletingCollectionId={deletingCollectionId}
        isAuthenticated={isAuthenticated}
        onCreateCollection={onCreateCollection}
        onDeleteCollection={onDeleteCollection}
        userId={userId}
      />
    );
  }

  if (activeCollections.length === 0) {
    return <CollectionCategoryEmptyState categoryLabel={activeTabLabel} />;
  }

  return (
    <SystemCollectionsGrid
      canImport={canImportSystemCollections}
      collections={activeCollections}
      importError={importError}
      importingCollectionId={importingCollectionId}
      onImportCollection={onImportSystemCollection}
    />
  );
}

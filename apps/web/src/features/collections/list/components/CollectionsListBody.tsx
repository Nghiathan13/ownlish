import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CollectionCategoryEmptyState } from "@/features/collections/list/components/CollectionCategoryEmptyState";
import { CollectionsGridSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import { SystemCollectionsGrid } from "@/features/collections/list/components/SystemCollectionsGrid";
import { UserCollectionsGrid } from "@/features/collections/list/components/UserCollectionsGrid";

type CollectionsListBodyProps = {
  activeCollections: CollectionSummary[];
  activeTabLabel: string;
  collectionsError: string | null;
  defaultCollection: CollectionSummary | null;
  deleteError: string | null;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  isLoadingCollections: boolean;
  isUserTab: boolean;
  onCreateCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
  onRetry: () => void;
  userId: string | null;
};

export function CollectionsListBody({
  activeCollections,
  activeTabLabel,
  collectionsError,
  defaultCollection,
  deleteError,
  deletingCollectionId,
  isAuthenticated,
  isLoadingCollections,
  isUserTab,
  onCreateCollection,
  onDeleteCollection,
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

  return <SystemCollectionsGrid collections={activeCollections} />;
}

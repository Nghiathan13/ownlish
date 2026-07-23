import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CollectionsGridSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import { UserCollectionsGrid } from "@/features/collections/list/components/UserCollectionsGrid";

type CollectionsListBodyProps = {
  activeCollections: CollectionSummary[];
  collectionsError: string | null;
  defaultCollection: CollectionSummary | null;
  deleteError: string | null;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  isLoadingCollections: boolean;
  onCreateCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
  onEditCollection: (collection: CollectionSummary) => void;
  onRetry: () => void;
  userId: string | null;
};

export function CollectionsListBody({
  activeCollections,
  collectionsError,
  defaultCollection,
  deleteError,
  deletingCollectionId,
  isAuthenticated,
  isLoadingCollections,
  onCreateCollection,
  onDeleteCollection,
  onEditCollection,
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

  return (
    <UserCollectionsGrid
      collections={activeCollections}
      defaultCollection={defaultCollection}
      deleteError={deleteError}
      deletingCollectionId={deletingCollectionId}
      isAuthenticated={isAuthenticated}
      onCreateCollection={onCreateCollection}
      onDeleteCollection={onDeleteCollection}
      onEditCollection={onEditCollection}
      userId={userId}
    />
  );
}

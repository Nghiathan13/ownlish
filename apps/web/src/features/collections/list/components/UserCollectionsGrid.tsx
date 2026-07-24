import type { CollectionSummary } from "@/entities/collection/api/collections";
import { MyVocabularyCard } from "@/features/collections/list/components/MyVocabularyCard";
import { CreateCollectionCard } from "@/features/collections/list/components/CreateCollectionCard";
import { UserCollectionCard } from "@/features/collections/list/components/UserCollectionCard";
import { userCollectionCardGridClassName } from "@/features/collections/shared/lib/collectionListCard";

type UserCollectionsGridProps = {
  collections: CollectionSummary[];
  defaultCollection: CollectionSummary | null;
  deleteError: string | null;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  onCreateCollection: () => void;
  onDeleteCollection: (collection: CollectionSummary) => void;
  onEditCollection: (collection: CollectionSummary) => void;
  userId: string | null;
};

export function UserCollectionsGrid({
  collections,
  defaultCollection,
  deleteError,
  deletingCollectionId,
  isAuthenticated,
  onCreateCollection,
  onDeleteCollection,
  onEditCollection,
  userId,
}: UserCollectionsGridProps) {
  return (
    <>
      {deleteError ? (
        <p className="mb-4 px-4 text-sm text-danger lg:px-16">{deleteError}</p>
      ) : null}
      <div className={userCollectionCardGridClassName}>
        <MyVocabularyCard
          collection={defaultCollection}
          deletingCollectionId={deletingCollectionId}
          isAuthenticated={isAuthenticated}
          onEdit={onEditCollection}
          userId={userId}
        />
        {collections.map((collection) => (
          <UserCollectionCard
            collection={collection}
            deletingCollectionId={deletingCollectionId}
            key={collection.id}
            onDelete={onDeleteCollection}
            onEdit={onEditCollection}
          />
        ))}
        <CreateCollectionCard onClick={onCreateCollection} />
      </div>
    </>
  );
}

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { MyVocabularyCard } from "@/features/collections/list/components/MyVocabularyCard";
import { CreateCollectionCard } from "@/features/collections/list/components/CreateCollectionCard";
import { UserCollectionCard } from "@/features/collections/list/components/UserCollectionCard";

type UserCollectionsGridProps = {
  collections: CollectionSummary[];
  defaultCollection: CollectionSummary | null;
  deleteError: string | null;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  onCreateCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
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
  userId,
}: UserCollectionsGridProps) {
  return (
    <>
      {deleteError ? (
        <p className="mb-4 px-4 text-sm text-danger">{deleteError}</p>
      ) : null}
      <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4">
        <MyVocabularyCard
          collection={defaultCollection}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
        {collections.map((collection) => (
          <UserCollectionCard
            collection={collection}
            deletingCollectionId={deletingCollectionId}
            isAuthenticated={isAuthenticated}
            key={collection.id}
            onDelete={onDeleteCollection}
            userId={userId}
          />
        ))}
        <CreateCollectionCard onClick={onCreateCollection} />
      </div>
    </>
  );
}

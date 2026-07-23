import { CollectionNotFoundState } from "@/features/collections/detail/page/components/CollectionNotFoundState";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import { CollectionWordsPanel } from "@/features/collections/detail/user/panel/components/CollectionWordsPanel";

type CollectionDetailBodyProps = {
  collectionId: string;
  collectionsError: string | null;
  hasCollectionsList: boolean;
  isNotFound: boolean;
  onReloadCollections: () => void;
};

export function CollectionDetailBody({
  collectionId,
  collectionsError,
  hasCollectionsList,
  isNotFound,
  onReloadCollections,
}: CollectionDetailBodyProps) {
  if (collectionsError && !hasCollectionsList) {
    return (
      <div className="px-4">
        <CollectionsRetryPanel
          message={collectionsError}
          onRetry={onReloadCollections}
        />
      </div>
    );
  }

  if (isNotFound) {
    return <CollectionNotFoundState />;
  }

  return <CollectionWordsPanel collectionId={collectionId} />;
}

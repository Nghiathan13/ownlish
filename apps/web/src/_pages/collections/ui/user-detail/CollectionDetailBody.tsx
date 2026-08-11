import { CollectionWordsPanel } from "../vocabulary/CollectionWordsPanel";
import { CollectionsRetryPanel } from "@/features/collections";
import { CollectionNotFoundState } from "./CollectionNotFoundState";

type CollectionDetailBodyProps = {
  collectionId: string;
  collectionName: string | null;
  collectionsError: string | null;
  hasCollectionsList: boolean;
  isNotFound: boolean;
  onReloadCollections: () => void;
};

export function CollectionDetailBody({
  collectionId,
  collectionName,
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

  return <CollectionWordsPanel collectionId={collectionId} collectionName={collectionName} />;
}

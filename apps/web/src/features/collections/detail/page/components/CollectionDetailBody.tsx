import type { CatalogWord, CollectionSummary } from "@/entities/collection/api/collections";
import { SystemCollectionWordsPanel } from "@/features/collections/detail/system/panel/components/SystemCollectionWordsPanel";
import { CollectionNotFoundState } from "@/features/collections/detail/page/components/CollectionNotFoundState";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import { CollectionWordsPanel } from "@/features/collections/detail/user/panel/components/CollectionWordsPanel";

type CollectionDetailBodyProps = {
  catalogWords: CatalogWord[];
  collectionId: string;
  collectionsError: string | null;
  hasCollectionsList: boolean;
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  isLoadingCollectionDetail: boolean;
  isNotFound: boolean;
  isSystemCollection: boolean;
  loadError: string | null;
  onImportClick: (catalogDefinitionIds?: string[]) => Promise<void>;
  onReloadCollectionDetail: () => void;
  onReloadCollections: () => void;
  resolvedImportTargetCollectionId: string | null;
  userOwnedCollections: CollectionSummary[];
};

export function CollectionDetailBody({
  catalogWords,
  collectionId,
  collectionsError,
  hasCollectionsList,
  importError,
  importResultMessage,
  isImporting,
  isLoadingCollectionDetail,
  isNotFound,
  isSystemCollection,
  loadError,
  onImportClick,
  onReloadCollectionDetail,
  onReloadCollections,
  resolvedImportTargetCollectionId,
  userOwnedCollections,
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

  if (isSystemCollection) {
    return (
      <SystemCollectionWordsPanel
        hasCollectionsList={hasCollectionsList}
        importError={importError}
        importResultMessage={importResultMessage}
        isImporting={isImporting}
        isLoading={isLoadingCollectionDetail}
        loadError={loadError}
        onImportClick={onImportClick}
        onRetry={onReloadCollectionDetail}
        resolvedImportTargetCollectionId={resolvedImportTargetCollectionId}
        userOwnedCollections={userOwnedCollections}
        words={catalogWords}
      />
    );
  }

  return (
    <CollectionWordsPanel collectionId={collectionId} />
  );
}

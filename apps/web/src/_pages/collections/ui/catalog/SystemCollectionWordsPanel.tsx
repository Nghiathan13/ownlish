"use client";

import type { CatalogWord, CollectionSummary } from "@/entities/collection";
import { SystemCollectionWordsPanelBody } from "@/_pages/collections/ui/catalog/SystemCollectionWordsPanelBody";
import { useSystemCollectionWordsPanel } from "@/_pages/collections/model/catalog/useSystemCollectionWordsPanel";

type SystemCollectionWordsPanelProps = {
  hasCollectionsList: boolean;
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onImportClick: (
    catalogDefinitionIds: string[] | undefined,
    targetCollectionId: string,
  ) => Promise<void>;
  onRetry?: () => void;
  userOwnedCollections: CollectionSummary[];
  words: CatalogWord[];
};

export function SystemCollectionWordsPanel({
  hasCollectionsList,
  importError,
  importResultMessage,
  isImporting,
  isLoading,
  loadError,
  onImportClick,
  onRetry,
  userOwnedCollections,
  words,
}: SystemCollectionWordsPanelProps) {
  const panel = useSystemCollectionWordsPanel({ onImportClick, words });

  return (
    <SystemCollectionWordsPanelBody
      {...panel}
      hasCollectionsList={hasCollectionsList}
      importError={importError}
      importResultMessage={importResultMessage}
      isImporting={isImporting}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={onRetry}
      userOwnedCollections={userOwnedCollections}
    />
  );
}

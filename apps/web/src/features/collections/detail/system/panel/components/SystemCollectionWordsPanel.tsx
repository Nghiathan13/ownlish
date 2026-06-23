"use client";

import type { CatalogWord, CollectionSummary } from "@/entities/collection/api/collections";
import { SystemCollectionWordsPanelBody } from "@/features/collections/detail/system/panel/components/SystemCollectionWordsPanelBody";
import { useSystemCollectionWordsPanel } from "@/features/collections/detail/system/panel/hooks/useSystemCollectionWordsPanel";

type SystemCollectionWordsPanelProps = {
  hasCollectionsList: boolean;
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onImportClick: (catalogDefinitionIds?: string[]) => Promise<void>;
  onRetry?: () => void;
  resolvedImportTargetCollectionId: string | null;
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
  resolvedImportTargetCollectionId,
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
      resolvedImportTargetCollectionId={resolvedImportTargetCollectionId}
      userOwnedCollections={userOwnedCollections}
    />
  );
}

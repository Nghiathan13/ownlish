"use client";

import { getDefaultUserCollection } from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsList } from "@/features/collections/hooks/useCollections";
import { CollectionWordsPanel } from "@/features/vocabulary/components/CollectionWordsPanel";

type MyVocabularyWordsPanelProps = {
  className?: string;
};

export function MyVocabularyWordsPanel({ className }: MyVocabularyWordsPanelProps) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const { collections, isLoadingCollections } = useCollectionsList({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const defaultCollection = getDefaultUserCollection(collections);

  if (isLoadingCollections || !defaultCollection) {
    return (
      <p className="text-sm text-muted-foreground">Loading vocabulary...</p>
    );
  }

  return (
    <CollectionWordsPanel
      className={className}
      collectionId={defaultCollection.id}
    />
  );
}

"use client";

import { CreateCollectionModal } from "@/features/collections/shared/components/CreateCollectionModal";
import { CollectionCategoryTabs } from "@/features/collections/list/components/CollectionCategoryTabs";
import { CollectionsListBody } from "@/features/collections/list/components/CollectionsListBody";
import { useCollectionsListPage } from "@/features/collections/list/hooks/useCollectionsListPage";
import { PageShell } from "@/shared/ui/PageShell";

export function CollectionsPage() {
  const page = useCollectionsListPage();

  return (
    <PageShell>
      <CollectionCategoryTabs
        activeCategory={page.activeCategory}
        onCategoryChange={page.setActiveCategory}
      />
      <CollectionsListBody
        activeCollections={page.activeCollections}
        activeTabLabel={page.activeTabLabel}
        collectionsError={page.collectionsError}
        defaultCollection={page.defaultCollection}
        deleteError={page.deleteError}
        deletingCollectionId={page.deletingCollectionId}
        isAuthenticated={page.isAuthenticated}
        isLoadingCollections={page.isLoadingCollections}
        isUserTab={page.isUserTab}
        onCreateCollection={page.openCreateCollection}
        onDeleteCollection={page.handleDeleteCollection}
        onRetry={page.reloadCollections}
        userId={page.userId}
      />
      <CreateCollectionModal
        isOpen={page.isCreateCollectionOpen}
        onClose={page.closeCreateCollection}
      />
    </PageShell>
  );
}

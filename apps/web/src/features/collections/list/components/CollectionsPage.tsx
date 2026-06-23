"use client";

import { useSearchParams } from "next/navigation";
import {
  parseCollectionCategoryTab,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { CreateCollectionModal } from "@/features/collections/shared/components/CreateCollectionModal";
import { EditCollectionModal } from "@/features/collections/shared/components/EditCollectionModal";
import { CollectionCategoryTabs } from "@/features/collections/list/components/CollectionCategoryTabs";
import { CollectionsListBody } from "@/features/collections/list/components/CollectionsListBody";
import { useCollectionsListPage } from "@/features/collections/list/hooks/useCollectionsListPage";
import { PageShell } from "@/shared/ui/PageShell";

function CollectionsPageContent({
  initialCategory,
}: {
  initialCategory: CollectionCategory;
}) {
  const page = useCollectionsListPage(initialCategory);

  return (
    <PageShell>
      <CollectionCategoryTabs
        activeCategory={page.activeCategory}
        onCategoryChange={page.setActiveCategory}
      />
      <CollectionsListBody
        activeCollections={page.activeCollections}
        activeTabLabel={page.activeTabLabel}
        canImportSystemCollections={page.canImportSystemCollections}
        collectionsError={page.collectionsError}
        defaultCollection={page.defaultCollection}
        deleteError={page.deleteError}
        deletingCollectionId={page.deletingCollectionId}
        importError={page.importError}
        importingCollectionId={page.importingCollectionId}
        isAuthenticated={page.isAuthenticated}
        isLoadingCollections={page.isLoadingCollections}
        isUserTab={page.isUserTab}
        onCreateCollection={page.openCreateCollection}
        onDeleteCollection={page.handleDeleteCollection}
        onEditCollection={page.openEditCollection}
        onImportSystemCollection={page.handleImportSystemCollection}
        onRetry={page.reloadCollections}
        userId={page.userId}
      />
      <CreateCollectionModal
        isOpen={page.isCreateCollectionOpen}
        onClose={page.closeCreateCollection}
      />
      <EditCollectionModal
        collection={page.editingCollection}
        onClose={page.closeEditCollection}
        userId={page.userId}
      />
    </PageShell>
  );
}

export function CollectionsPage() {
  const searchParams = useSearchParams();
  const initialCategory =
    parseCollectionCategoryTab(searchParams.get("tab")) ?? "user";

  return (
    <CollectionsPageContent
      key={initialCategory}
      initialCategory={initialCategory}
    />
  );
}

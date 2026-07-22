"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCollectionsListPath,
  parseCollectionCategoryTab,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { CreateCollectionModal } from "@/features/collections/shared/components/CreateCollectionModal";
import { EditCollectionModal } from "@/features/collections/shared/components/EditCollectionModal";
import { CollectionCategoryTabs } from "@/features/collections/list/components/CollectionCategoryTabs";
import { CollectionsListBody } from "@/features/collections/list/components/CollectionsListBody";
import { CollectionsPageSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { useCollectionsListPage } from "@/features/collections/list/hooks/useCollectionsListPage";
import { PageShell } from "@/shared/ui/PageShell";

function CollectionsPageContent({
  activeCategory,
}: {
  activeCategory: CollectionCategory;
}) {
  const page = useCollectionsListPage(activeCategory);

  return (
    <PageShell>
      <CollectionCategoryTabs
        activeCategory={activeCategory}
        collections={page.collections}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeCategory: CollectionCategory =
    parseCollectionCategoryTab(tabParam) ?? "user";
  const isTabParamValid = tabParam === activeCategory;

  useEffect(() => {
    if (!isTabParamValid) {
      router.replace(getCollectionsListPath(activeCategory), { scroll: false });
    }
  }, [activeCategory, isTabParamValid, router]);

  if (!isTabParamValid) {
    return <CollectionsPageSkeleton />;
  }

  return (
    <CollectionsPageContent
      key={activeCategory}
      activeCategory={activeCategory}
    />
  );
}

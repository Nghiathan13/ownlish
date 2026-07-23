"use client";

import {
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { CreateCollectionModal } from "@/features/collections/shared/components/CreateCollectionModal";
import { EditCollectionModal } from "@/features/collections/shared/components/EditCollectionModal";
import { CollectionCategorySelect } from "@/features/collections/list/components/CollectionCategorySelect";
import { CollectionsListBody } from "@/features/collections/list/components/CollectionsListBody";
import { OxfordBandTabs } from "@/features/collections/oxford/components/OxfordBandTabs";
import { OxfordCollections } from "@/features/collections/oxford/components/OxfordCollections";
import {
  parseOxfordBand,
  parseOxfordGroup,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { useCollectionsListPage } from "@/features/collections/list/hooks/useCollectionsListPage";
import { PageShell } from "@/shared/ui/PageShell";

type CollectionsPageProps = {
  category: CollectionCategory;
  bandParam?: string | null;
  groupParam?: string | null;
};

export function CollectionsPage({
  category,
  bandParam = null,
  groupParam = null,
}: CollectionsPageProps) {
  const page = useCollectionsListPage(category);
  const oxfordBand = parseOxfordBand(bandParam) ?? "A1";
  const oxfordGroup = parseOxfordGroup(groupParam);

  return (
    <PageShell>
      {category === "oxford" && oxfordGroup === null ? (
        <div className="my-4 flex flex-wrap items-center gap-4 px-4 lg:my-8 lg:px-16">
          <CollectionCategorySelect activeCategory={category} />
          <OxfordBandTabs activeBand={oxfordBand} />
        </div>
      ) : category !== "oxford" ? (
        <div className="my-4 px-4 lg:my-8 lg:px-16">
          <CollectionCategorySelect activeCategory={category} />
        </div>
      ) : null}
      {category === "oxford" ? (
        <OxfordCollections
          bandParam={bandParam}
          collections={page.activeCollections}
          error={page.collectionsError}
          groupParam={groupParam}
          isAuthenticated={page.isAuthenticated}
          isLoading={page.isLoadingCollections}
          onRetry={page.reloadCollections}
          targetCollectionId={page.defaultCollection?.id ?? null}
          userId={page.userId}
        />
      ) : (
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
      )}
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

"use client";

import {
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { CreateCollectionModal } from "@/features/collections/shared/components/CreateCollectionModal";
import { EditCollectionModal } from "@/features/collections/shared/components/EditCollectionModal";
import { CollectionCategorySelect } from "@/features/collections/list/components/CollectionCategorySelect";
import { CollectionsListBody } from "@/features/collections/list/components/CollectionsListBody";
import { OxfordCollections } from "@/features/collections/oxford/components/OxfordCollections";
import { useCollectionsListPage } from "@/features/collections/list/hooks/useCollectionsListPage";
import { PageShell } from "@/shared/ui/PageShell";

type CollectionsPageProps = {
  category: CollectionCategory;
  bandParam?: string | null;
  groupParam?: string | null;
};

function UserCollectionsPage({ category }: { category: CollectionCategory }) {
  const page = useCollectionsListPage(category);

  return (
    <PageShell>
      <div className="my-4 px-4 lg:my-8 lg:px-16">
        <CollectionCategorySelect activeCategory={category} />
      </div>
      <CollectionsListBody
        activeCollections={page.activeCollections}
        collectionsError={page.collectionsError}
        defaultCollection={page.defaultCollection}
        deleteError={page.deleteError}
        deletingCollectionId={page.deletingCollectionId}
        isAuthenticated={page.isAuthenticated}
        isLoadingCollections={page.isLoadingCollections}
        onCreateCollection={page.openCreateCollection}
        onDeleteCollection={page.handleDeleteCollection}
        onEditCollection={page.openEditCollection}
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

function OxfordCollectionsPage({
  bandParam,
  groupParam,
}: Pick<CollectionsPageProps, "bandParam" | "groupParam">) {
  return (
    <PageShell>
      <OxfordCollections
        bandParam={bandParam ?? null}
        groupParam={groupParam ?? null}
      />
    </PageShell>
  );
}

export function CollectionsPage({
  category,
  bandParam = null,
  groupParam = null,
}: CollectionsPageProps) {
  if (category === "oxford") {
    return <OxfordCollectionsPage bandParam={bandParam} groupParam={groupParam} />;
  }

  return <UserCollectionsPage category={category} />;
}

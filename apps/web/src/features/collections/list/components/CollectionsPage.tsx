"use client";

import {
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
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
  const { status, user } = useAuthSession();
  const oxfordBand = parseOxfordBand(bandParam ?? null) ?? "A1";
  const oxfordGroup = parseOxfordGroup(groupParam ?? null);
  const isAuthenticated = isAuthenticatedStatus(status);

  return (
    <PageShell>
      {oxfordGroup === null ? (
        <div className="my-4 flex flex-wrap items-center gap-4 px-4 lg:my-8 lg:px-16">
          <CollectionCategorySelect activeCategory="oxford" />
          <OxfordBandTabs activeBand={oxfordBand} />
        </div>
      ) : null}
      <OxfordCollections
        bandParam={bandParam ?? null}
        groupParam={groupParam ?? null}
        isAuthenticated={isAuthenticated}
        userId={user?.id ?? null}
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

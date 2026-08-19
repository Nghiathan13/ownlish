"use client";

import {
  CreateCollectionModal,
  EditCollectionModal,
  CollectionsListBody,
  useCollectionsListPage,
} from "@/features/collections";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";

export function UserCollectionsPage() {
  const t = useT();
  const page = useCollectionsListPage("user");
  const pendingDelete = page.pendingDeleteCollection;

  return (
    <>
      <CollectionsListBody
        activeCollections={page.activeCollections}
        collectionsError={page.collectionsError}
        defaultCollection={page.defaultCollection}
        deleteError={page.deleteError}
        deletingCollectionId={page.deletingCollectionId}
        isAuthenticated={page.isAuthenticated}
        isLoadingCollections={page.isLoadingCollections}
        onCreateCollection={page.openCreateCollection}
        onDeleteCollection={page.requestDeleteCollection}
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
      {pendingDelete ? (
        <ConfirmModal
          cancelLabel={t("collections.deleteCollectionCancel")}
          confirmLabel={t("collections.deleteCollectionConfirm")}
          confirmingLabel={t("collections.deleting")}
          isConfirming={page.deletingCollectionId === pendingDelete.id}
          onClose={page.cancelDeleteCollection}
          onConfirm={() => void page.confirmDeleteCollection()}
          subtitle={t("collections.deleteCollectionSubtitle")}
          title={formatMessage(t("collections.deleteNamed"), {
            name: pendingDelete.name,
          })}
        />
      ) : null}
    </>
  );
}

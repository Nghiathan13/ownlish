"use client";

import type {
  CollectionSummary,
  UpdateCollectionInput,
} from "@/entities/collection";
import { EditCollectionForm } from "./EditCollectionForm";
import { useUpdateCollection } from "../../model/mutations/hooks";
import { useT } from "@/shared/lib/providers";
import { Modal } from "@/shared/ui/Modal";

type EditCollectionModalProps = {
  collection: CollectionSummary | null;
  onClose: () => void;
  userId: string | null;
};

export function EditCollectionModal({
  collection,
  onClose,
  userId,
}: EditCollectionModalProps) {
  const t = useT();
  const { resetUpdateState, updateCollection } = useUpdateCollection({
    userId,
  });

  if (!collection) {
    return null;
  }

  return (
    <Modal
      description={t("collections.editDescription")}
      onClose={() => {
        resetUpdateState();
        onClose();
      }}
      title={t("collections.editCollection")}
    >
      <EditCollectionForm
        collection={collection}
        onSubmit={async (input: UpdateCollectionInput) => {
          await updateCollection({
            collectionId: collection.id,
            input,
          });
        }}
        onUpdated={() => {
          resetUpdateState();
          onClose();
        }}
      />
    </Modal>
  );
}

"use client";

import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { CreateCollectionForm } from "@/features/collections/components/CreateCollectionForm";
import { useCreateCollection } from "@/features/collections/hooks/useCollections";
import { Modal } from "@/shared/ui/Modal";

type CreateCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateCollectionModal({
  isOpen,
  onClose,
}: CreateCollectionModalProps) {
  const { user } = useAuthSession();
  const { createCollection, resetCreateState } = useCreateCollection({
    userId: user?.id ?? null,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      description="Create a personal word set to organize your vocabulary."
      onClose={() => {
        resetCreateState();
        onClose();
      }}
      title="New collection"
    >
      <CreateCollectionForm
        onCreate={createCollection}
        onCreated={() => {
          resetCreateState();
          onClose();
        }}
      />
    </Modal>
  );
}

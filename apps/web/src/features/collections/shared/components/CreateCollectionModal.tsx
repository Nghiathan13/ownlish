"use client";

import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { CreateCollectionForm } from "@/features/collections/shared/components/CreateCollectionForm";
import { useCreateCollection } from "@/features/collections/shared/mutations/hooks";
import { useT } from "@/shared/providers/LocaleProvider";
import { Modal } from "@/shared/ui/Modal";

type CreateCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateCollectionModal({
  isOpen,
  onClose,
}: CreateCollectionModalProps) {
  const t = useT();
  const { user } = useAuthSession();
  const { createCollection, resetCreateState } = useCreateCollection({
    userId: user?.id ?? null,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      description={t("collections.createDescription")}
      onClose={() => {
        resetCreateState();
        onClose();
      }}
      title={t("collections.newCollection")}
    >
      <CreateCollectionForm
        onCreate={async (input) => {
          await createCollection(input);
        }}
        onCreated={() => {
          resetCreateState();
          onClose();
        }}
      />
    </Modal>
  );
}

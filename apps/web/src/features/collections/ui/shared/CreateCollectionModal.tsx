"use client";

import { useAuthSession } from "@/entities/session";
import { CreateCollectionForm } from "./CreateCollectionForm";
import { useCreateCollection } from "../../model/mutations/hooks";
import { useT } from "@/shared/lib/providers";
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

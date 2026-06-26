"use client";

import { Modal } from "@/shared/ui/Modal";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type AdminConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isConfirming?: boolean;
};

export function AdminConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  isConfirming = false,
}: AdminConfirmDialogProps) {
  return (
    <Modal description={description} onClose={onClose} title={title}>
      <div className="flex justify-end gap-2">
        <button
          className={secondaryTextButtonClassName()}
          disabled={isConfirming}
          onClick={onClose}
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          className={primaryTextButtonClassName()}
          disabled={isConfirming}
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

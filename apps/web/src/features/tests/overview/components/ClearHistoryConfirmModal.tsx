"use client";

import { Modal } from "@/shared/ui/Modal";
import {
  secondaryTextButtonClassName,
  textButtonClassName,
} from "@/shared/ui/button";

type ClearHistoryConfirmModalProps = {
  title: string;
  subtitle: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ClearHistoryConfirmModal({
  title,
  subtitle,
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  isConfirming = false,
  onConfirm,
  onClose,
}: ClearHistoryConfirmModalProps) {
  return (
    <Modal
      className="max-w-md"
      description={subtitle}
      onClose={isConfirming ? () => undefined : onClose}
      showCloseButton={false}
      title={title}
    >
      <div className="flex flex-col gap-4 border-t border-border pt-4">
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
            className={textButtonClassName(
              "border-red-700 bg-red-700 text-white hover:border-red-800 hover:bg-red-800 dark:border-red-500 dark:bg-red-500 dark:text-white dark:hover:border-red-400 dark:hover:bg-red-400",
            )}
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? "Clearing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

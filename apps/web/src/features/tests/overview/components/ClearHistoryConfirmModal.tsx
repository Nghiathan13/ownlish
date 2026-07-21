"use client";

import { Modal } from "@/shared/ui/Modal";
import { textButtonClassName } from "@/shared/ui/button";

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
      className="max-w-md gap-0 rounded-[16px] bg-surface p-0 shadow-card dark:border dark:border-border [&>div:first-child]:px-6 [&>div:first-child]:pb-4 [&>div:first-child]:pt-6"
      description={subtitle}
      onClose={isConfirming ? () => undefined : onClose}
      showCloseButton={false}
      title={title}
    >
      <div className="border-t border-border" />
      <div className="flex gap-2 p-6">
        <button
          className={textButtonClassName(
            "flex-1 border-border bg-transparent text-foreground hover:border-border hover:bg-hover-overlay",
          )}
          disabled={isConfirming}
          onClick={onClose}
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          className={textButtonClassName(
            "flex-1 border-red-700 bg-red-700 text-white hover:border-red-700 hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)] dark:border-red-500 dark:bg-red-500 dark:hover:border-red-500",
          )}
          disabled={isConfirming}
          onClick={onConfirm}
          type="button"
        >
          {isConfirming ? "Clearing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

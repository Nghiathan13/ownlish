"use client";

import { Modal } from "@/shared/ui/Modal";
import { textButtonClassName } from "@/shared/ui/button";
import { useT } from "@/shared/lib/providers";

type ConfirmModalProps = {
  title: string;
  subtitle: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmingLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  title,
  subtitle,
  confirmLabel,
  cancelLabel,
  confirmingLabel,
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const t = useT();
  const resolvedConfirmLabel = confirmLabel ?? t("tests.submit");
  const resolvedCancelLabel = cancelLabel ?? t("tests.cancel");
  const resolvedConfirmingLabel = confirmingLabel ?? t("tests.clearing");

  return (
    <Modal
      className="max-w-md gap-0 rounded-card bg-surface p-0 shadow-card dark:border dark:border-border [&>div:first-child]:px-6 [&>div:first-child]:pb-4 [&>div:first-child]:pt-6"
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
          {resolvedCancelLabel}
        </button>
        <button
          className={textButtonClassName(
            "flex-1 border-danger bg-danger text-danger-foreground hover:border-danger hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)] ",
          )}
          disabled={isConfirming}
          onClick={onConfirm}
          type="button"
        >
          {isConfirming ? resolvedConfirmingLabel : resolvedConfirmLabel}
        </button>
      </div>
    </Modal>
  );
}

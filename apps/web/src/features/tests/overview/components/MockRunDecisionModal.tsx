"use client";

import { Modal } from "@/shared/ui/Modal";
import { textButtonClassName } from "@/shared/ui/button";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type MockRunDecisionModalProps = {
  isRestarting: boolean;
  parts: number[];
  status: "open" | "pending";
  onClose: () => void;
  onContinue: () => void;
  onRestart: () => void;
};

export function MockRunDecisionModal({
  isRestarting,
  parts,
  status,
  onClose,
  onContinue,
  onRestart,
}: MockRunDecisionModalProps) {
  const t = useT();
  const isPending = status === "pending";

  return (
    <Modal
      className="max-w-md gap-0 rounded-[16px] bg-surface p-0 shadow-card dark:border dark:border-border [&>div:first-child]:px-6 [&>div:first-child]:pb-4 [&>div:first-child]:pt-6"
      description={formatMessage(
        t(isPending ? "tests.mockFinishPendingDescription" : "tests.mockResumeDescription"),
        { parts: parts.join(", ") },
      )}
      onClose={isRestarting ? () => undefined : onClose}
      showCloseButton={false}
      title={t(isPending ? "tests.mockFinishPendingTitle" : "tests.mockResumeTitle")}
    >
      <div className="border-t border-border" />
      <div className="flex gap-2 p-6">
        {isPending ? null : (
          <button
            className={textButtonClassName(
              "flex-1 border-border bg-transparent text-foreground hover:border-border hover:bg-hover-overlay",
            )}
            disabled={isRestarting}
            onClick={onRestart}
            type="button"
          >
            {isRestarting ? t("tests.starting") : t("tests.restartMock")}
          </button>
        )}
        <button
          className={textButtonClassName(
            "flex-1 border-foreground bg-foreground text-background hover:border-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
          )}
          disabled={isRestarting}
          onClick={onContinue}
          type="button"
        >
          {isPending ? t("tests.openResult") : t("tests.continueMock")}
        </button>
      </div>
    </Modal>
  );
}

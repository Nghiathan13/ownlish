"use client";

import { primaryTextButtonClassName } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/Modal";
import { useT } from "@/shared/providers/LocaleProvider";

type MockFinishFailureModalProps = {
  error: string;
  isRetrying: boolean;
  onClose: () => void;
  onRetry: () => void;
};

export function MockFinishFailureModal({
  error,
  isRetrying,
  onClose,
  onRetry,
}: MockFinishFailureModalProps) {
  const t = useT();

  return (
    <Modal onClose={onClose} title={t("tests.couldNotFinishMockTest")}>
      <div className="grid gap-4">
        <p className="text-muted-foreground">{error}</p>
        <p>{t("tests.finishFailureLocalEditsNote")}</p>
        <div>
          <button
            aria-busy={isRetrying}
            className={primaryTextButtonClassName()}
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            {isRetrying ? t("tests.retrying") : t("tests.retryFinish")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

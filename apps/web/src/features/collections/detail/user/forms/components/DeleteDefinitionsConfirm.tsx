"use client";

import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type DeleteDefinitionsConfirmProps = {
  count: number;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDefinitionsConfirm({
  count,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteDefinitionsConfirmProps) {
  const t = useT();

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        {formatMessage(t("wordsTable.deleteConfirm"), { count })}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          className={primaryTextButtonClassName()}
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? t("wordsTable.deleting") : t("wordsTable.delete")}
        </button>
        <button
          type="button"
          className={secondaryTextButtonClassName()}
          onClick={onCancel}
        >
          {t("wordsTable.cancel")}
        </button>
      </div>
    </div>
  );
}

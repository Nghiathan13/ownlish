"use client";

import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";

type SystemCollectionImportButtonProps = {
  isImporting: boolean;
  isDisabled?: boolean;
  onImport: () => void;
};

export function SystemCollectionImportButton({
  isImporting,
  isDisabled = false,
  onImport,
}: SystemCollectionImportButtonProps) {
  const t = useT();
  const enabledClassName = iconTextButtonClassName(
    "w-full border-border bg-transparent text-foreground hover:bg-hover-overlay",
  );
  const disabledClassName = iconTextButtonClassName(
    "w-full border-border bg-muted text-muted-foreground",
  );

  if (isDisabled) {
    return (
      <button className={disabledClassName} disabled type="button">
        {t("collections.import")}
      </button>
    );
  }

  return (
    <button
      className={enabledClassName}
      disabled={isImporting}
      onClick={onImport}
      type="button"
    >
      {isImporting ? t("collections.importing") : t("collections.import")}
    </button>
  );
}

"use client";

import { useT } from "@/shared/providers/LocaleProvider";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { MasterIcon } from "@/shared/ui/icons/MasterIcon";
import { Tooltip } from "@/shared/ui/Tooltip";
import { iconButtonGroupClassName } from "@/shared/ui/Tooltip/tooltipTheme";

type ReviewMasterButtonProps = {
  disabled: boolean;
  onMaster: () => void;
};

export function ReviewMasterButton({ disabled, onMaster }: ReviewMasterButtonProps) {
  const t = useT();

  return (
    <button
      aria-label={t("review.master")}
      className={iconOnlyButtonClassName(
        "relative bg-transparent text-status-mastered hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
        iconButtonGroupClassName,
      )}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onMaster();
      }}
      type="button"
    >
      <MasterIcon />
      <Tooltip group="icon-button" placement="bottom">
        {t("review.master")}
      </Tooltip>
    </button>
  );
}

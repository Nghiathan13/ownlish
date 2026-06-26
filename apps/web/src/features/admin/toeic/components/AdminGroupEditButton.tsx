"use client";

import { secondaryTextButtonClassName } from "@/shared/ui/button";

type AdminGroupEditButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

export function AdminGroupEditButton({
  disabled = false,
  onClick,
}: AdminGroupEditButtonProps) {
  return (
    <button
      className={secondaryTextButtonClassName()}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      Edit
    </button>
  );
}

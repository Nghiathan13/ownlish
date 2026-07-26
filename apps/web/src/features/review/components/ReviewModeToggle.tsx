"use client";

import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { FlashcardIcon } from "@/shared/ui/icons/FlashcardIcon";
import { KeyboardIcon } from "@/shared/ui/icons/KeyboardIcon";

export type ReviewMode = "flashcard" | "typing";

export const REVIEW_MODE_RAIL_CLASS_NAME =
  "box-border w-max shrink-0 self-start";

type ReviewModeToggleProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  orientation?: "horizontal" | "vertical";
};

function getModeButtonClassName(isActive: boolean) {
  return classNames(
    "inline-flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2 text-xs",
    isActive
      ? "bg-[#f0f0f0] hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
      : "hover:bg-hover-overlay",
  );
}

export function ReviewModeToggle({
  mode,
  onModeChange,
  orientation = "horizontal",
}: ReviewModeToggleProps) {
  const t = useT();
  const isVertical = orientation === "vertical";

  return (
    <div
      className={classNames(
        "flex gap-1 rounded-lg border border-border bg-surface p-1 dark:bg-[#000000]",
        REVIEW_MODE_RAIL_CLASS_NAME,
        isVertical ? "flex-col" : "mx-auto",
      )}
      role="tablist"
    >
      <button
        aria-selected={mode === "flashcard"}
        className={getModeButtonClassName(mode === "flashcard")}
        onClick={() => onModeChange("flashcard")}
        role="tab"
        type="button"
      >
        <FlashcardIcon className="size-7" />
        {t("review.flashcard")}
      </button>
      <button
        aria-selected={mode === "typing"}
        className={getModeButtonClassName(mode === "typing")}
        onClick={() => onModeChange("typing")}
        role="tab"
        type="button"
      >
        <KeyboardIcon className="size-7" />
        {t("review.keyboard")}
      </button>
    </div>
  );
}

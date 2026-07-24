"use client";

import { classNames } from "@/shared/lib/classNames";
import { FlashcardIcon } from "@/shared/ui/icons/FlashcardIcon";
import { KeyboardIcon } from "@/shared/ui/icons/KeyboardIcon";

export type ReviewMode = "flashcard" | "typing";

/** Fixed rail width keeps the card column stable across loading and session states. */
export const REVIEW_MODE_RAIL_CLASS_NAME =
  "box-border w-[84px] shrink-0 self-start border border-transparent dark:border-border";

type ReviewModeToggleProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  orientation?: "horizontal" | "vertical";
};

function getModeButtonClassName(isActive: boolean) {
  return classNames(
    "inline-flex w-full cursor-pointer flex-col items-center gap-1 rounded-md px-1 py-1.5 text-xs hover:bg-hover-overlay",
    isActive && "bg-muted",
  );
}

export function ReviewModeToggle({
  mode,
  onModeChange,
  orientation = "horizontal",
}: ReviewModeToggleProps) {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={classNames(
        "flex gap-1 rounded-lg bg-surface p-1 shadow-card",
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
        Flashcard
      </button>
      <button
        aria-selected={mode === "typing"}
        className={getModeButtonClassName(mode === "typing")}
        onClick={() => onModeChange("typing")}
        role="tab"
        type="button"
      >
        <KeyboardIcon className="size-7" />
        Keyboard
      </button>
    </div>
  );
}

"use client";

import { classNames } from "@/shared/lib/classNames";

export type ReviewMode = "flashcard" | "typing";

type ReviewModeToggleProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
};

const modeButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[13px] leading-5 font-normal";

function getModeButtonClassName(isActive: boolean) {
  return classNames(
    modeButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-transparent text-foreground hover:bg-hover-overlay",
  );
}

export function ReviewModeToggle({ mode, onModeChange }: ReviewModeToggleProps) {
  return (
    <div
      className="mx-auto flex w-fit gap-1 rounded-xl bg-muted p-1 dark:border dark:border-border"
      onClick={(event) => event.stopPropagation()}
      role="tablist"
    >
      <button
        aria-selected={mode === "flashcard"}
        className={getModeButtonClassName(mode === "flashcard")}
        onClick={() => onModeChange("flashcard")}
        role="tab"
        type="button"
      >
        Flashcard
      </button>
      <button
        aria-selected={mode === "typing"}
        className={getModeButtonClassName(mode === "typing")}
        onClick={() => onModeChange("typing")}
        role="tab"
        type="button"
      >
        Keyboard
      </button>
    </div>
  );
}

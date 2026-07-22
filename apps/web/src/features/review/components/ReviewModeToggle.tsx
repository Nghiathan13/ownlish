"use client";

export type ReviewMode = "flashcard" | "typing";

type ReviewModeToggleProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
};

export function ReviewModeToggle({ mode, onModeChange }: ReviewModeToggleProps) {
  return (
    <div
      className="relative mx-auto grid w-fit grid-cols-2 gap-2 rounded-lg border border-border bg-muted p-2"
      onClick={(event) => event.stopPropagation()}
      role="tablist"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc((100%-0.5rem)/2)] rounded-md bg-surface shadow-card transition-transform duration-200 ease-out dark:border dark:border-border ${
          mode === "typing" ? "translate-x-[calc(100%+0.125rem)]" : "translate-x-0"
        }`}
      />
      <button
        aria-selected={mode === "flashcard"}
        className={`relative z-10 inline-flex h-6 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-xs font-medium hover:bg-hover-overlay ${
          mode === "flashcard" ? "text-foreground" : "text-muted-foreground"
        }`}
        onClick={() => onModeChange("flashcard")}
        role="tab"
        type="button"
      >
        Flashcard
      </button>
      <button
        aria-selected={mode === "typing"}
        className={`relative z-10 inline-flex h-6 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-xs font-medium hover:bg-hover-overlay ${
          mode === "typing" ? "text-foreground" : "text-muted-foreground"
        }`}
        onClick={() => onModeChange("typing")}
        role="tab"
        type="button"
      >
        Keyboard
      </button>
    </div>
  );
}

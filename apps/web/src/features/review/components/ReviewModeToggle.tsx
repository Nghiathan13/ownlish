"use client";

export type ReviewMode = "flashcard" | "typing";

type ReviewModeToggleProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
};

export function ReviewModeToggle({ mode, onModeChange }: ReviewModeToggleProps) {
  return (
    <div
      className="relative grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1"
      role="tablist"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-lg bg-surface shadow-card transition-transform duration-200 ease-out dark:border dark:border-border ${
          mode === "typing" ? "translate-x-[calc(100%+0.25rem)]" : "translate-x-0"
        }`}
      />
      <button
        aria-selected={mode === "flashcard"}
        className={`relative z-10 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
          mode === "flashcard"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => onModeChange("flashcard")}
        role="tab"
        type="button"
      >
        Flashcard
      </button>
      <button
        aria-selected={mode === "typing"}
        className={`relative z-10 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
          mode === "typing"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
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

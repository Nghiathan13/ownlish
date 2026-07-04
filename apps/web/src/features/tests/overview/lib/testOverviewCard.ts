import { iconTextButtonClassName } from "@/shared/ui/button";

export const testOverviewCardClassName =
  "flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-sm";

export const testOverviewMockButtonClassName = iconTextButtonClassName(
  "flex-1 border-0 bg-transparent text-foreground hover:bg-hover-overlay",
);

export const testOverviewPracticeButtonClassName = iconTextButtonClassName(
  "flex-1 border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
);

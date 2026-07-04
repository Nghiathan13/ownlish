import { iconTextButtonClassName } from "@/shared/ui/button";

export const testOverviewCardClassName =
  "flex flex-col gap-4 rounded-[36px] bg-surface p-4 shadow-card";

export const testOverviewCardGridClassName =
  "grid gap-8 sm:grid-cols-2 xl:grid-cols-4";

export const testOverviewCardSkeletonClassName = "min-h-40 w-full rounded-[36px]";

export const testOverviewMockButtonClassName = iconTextButtonClassName(
  "flex-1 rounded-[20px] border-border bg-transparent text-foreground hover:bg-hover-overlay",
);

export const testOverviewPracticeButtonClassName = iconTextButtonClassName(
  "flex-1 rounded-[20px] border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
);

import { iconTextButtonClassName } from "@/shared/ui/button";

export const testOverviewCardClassName =
  "flex min-w-[300px] flex-col gap-4 rounded-[16px] border border-border bg-surface p-4 hover:border-primary dark:bg-[#000000]";

export const testOverviewCardGridClassName =
  "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]";

export const testOverviewCardSkeletonClassName = "min-h-40 w-full rounded-[20px]";

export const testOverviewMockButtonClassName = iconTextButtonClassName(
  "flex-1 border-border bg-transparent text-foreground hover:bg-hover-overlay",
);

export const testOverviewPracticeButtonClassName = iconTextButtonClassName(
  "flex-1 border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
);

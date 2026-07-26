import { iconTextButtonClassName } from "@/shared/ui/button";

export const testOverviewCardClassName =
  "flex min-w-[300px] flex-col gap-4 rounded-[16px] bg-surface p-4 shadow-card hover:[box-shadow:0_1px_2px_color-mix(in_srgb,var(--primary)_24%,transparent),0_4px_16px_color-mix(in_srgb,var(--primary)_36%,transparent)] dark:border dark:border-border dark:hover:border-primary dark:hover:[box-shadow:none]";

export const testOverviewCardGridClassName =
  "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]";

export const testOverviewCardSkeletonClassName = "min-h-40 w-full rounded-[20px]";

export const testOverviewMockButtonClassName = iconTextButtonClassName(
  "flex-1 border-border bg-transparent text-foreground hover:bg-hover-overlay",
);

export const testOverviewPracticeButtonClassName = iconTextButtonClassName(
  "flex-1 border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
);

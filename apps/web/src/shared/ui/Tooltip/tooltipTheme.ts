import { classNames } from "@/shared/lib/classNames";

export const sidebarLinkGroupClassName = "group/sidebar-link";
export const sidebarToggleGroupClassName = "group/sidebar-toggle";
export const iconButtonGroupClassName = "group/icon-button";

export type TooltipGroup = "sidebar-link" | "sidebar-toggle" | "icon-button";
export type TooltipPlacement = "bottom" | "right";

const tooltipVisibilityClassNames: Record<TooltipGroup, string> = {
  "sidebar-link":
    "group-hover/sidebar-link:block group-focus-visible/sidebar-link:block",
  "sidebar-toggle":
    "group-hover/sidebar-toggle:block group-focus-visible/sidebar-toggle:block",
  "icon-button":
    "group-hover/icon-button:block group-focus-visible/icon-button:block",
};

const tooltipPlacementClassNames: Record<TooltipPlacement, string> = {
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

export const tooltipBaseClassName =
  "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background";

export function tooltipClassName(
  group: TooltipGroup,
  placement: TooltipPlacement,
) {
  return classNames(
    tooltipBaseClassName,
    tooltipPlacementClassNames[placement],
    tooltipVisibilityClassNames[group],
  );
}

import type { ReactNode } from "react";
import {
  tooltipClassName,
  type TooltipGroup,
  type TooltipPlacement,
} from "@/shared/ui/Tooltip/tooltipTheme";

type TooltipProps = {
  children: ReactNode;
  group: TooltipGroup;
  placement: TooltipPlacement;
};

export function Tooltip({ children, group, placement }: TooltipProps) {
  return (
    <span aria-hidden className={tooltipClassName(group, placement)}>
      {children}
    </span>
  );
}

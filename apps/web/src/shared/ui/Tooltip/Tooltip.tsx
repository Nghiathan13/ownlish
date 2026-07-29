import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import {
  tooltipClassName,
  type TooltipGroup,
  type TooltipPlacement,
} from "@/shared/ui/Tooltip/tooltipTheme";

type TooltipProps = {
  children: ReactNode;
  className?: string;
  group: TooltipGroup;
  placement: TooltipPlacement;
};

export function Tooltip({ children, className, group, placement }: TooltipProps) {
  return (
    <span aria-hidden className={classNames(tooltipClassName(group, placement), className)}>
      {children}
    </span>
  );
}

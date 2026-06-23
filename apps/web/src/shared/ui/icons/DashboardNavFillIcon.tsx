import type { SVGProps } from "react";

type DashboardNavFillIconProps = SVGProps<SVGSVGElement>;

export function DashboardNavFillIcon({
  className,
  ...props
}: DashboardNavFillIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M530-600v-220h290v220H530ZM140-460v-360h290v360H140Zm390 320v-360h290v360H530Zm-390 0v-220h290v220H140Z" />
    </svg>
  );
}

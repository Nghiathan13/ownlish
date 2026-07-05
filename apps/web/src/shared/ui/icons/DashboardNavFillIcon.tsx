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
      <path d="M540-600v-200h260v200H540ZM160-480v-320h260v320H160Zm380 320v-320h260v320H540Zm-380 0v-200h260v200H160Z" />
    </svg>
  );
}

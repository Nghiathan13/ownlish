import type { SVGProps } from "react";

type ArrowDropDownIconProps = SVGProps<SVGSVGElement>;

export function ArrowDropDownIcon({
  className,
  ...props
}: ArrowDropDownIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M480-360 280-560h400L480-360Z" />
    </svg>
  );
}

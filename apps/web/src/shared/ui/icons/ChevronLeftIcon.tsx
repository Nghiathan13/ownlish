import type { SVGProps } from "react";

type ChevronLeftIconProps = SVGProps<SVGSVGElement>;

export function ChevronLeftIcon({ className, ...props }: ChevronLeftIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" />
    </svg>
  );
}

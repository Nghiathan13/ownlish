import type { SVGProps } from "react";

type SkipPreviousIconProps = SVGProps<SVGSVGElement>;

export function SkipPreviousIcon({ className, ...props }: SkipPreviousIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Zm-80-240Zm0 90v-180l-136 90 136 90Z" />
    </svg>
  );
}

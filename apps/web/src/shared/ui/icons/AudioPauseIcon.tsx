import type { SVGProps } from "react";

type AudioPauseIconProps = SVGProps<SVGSVGElement>;

export function AudioPauseIcon({ className, ...props }: AudioPauseIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M560-240v-480h140v480H560Zm-300 0v-480h140v480H260Z" />
    </svg>
  );
}

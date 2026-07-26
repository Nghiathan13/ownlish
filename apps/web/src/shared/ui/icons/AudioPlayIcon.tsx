import type { SVGProps } from "react";

type AudioPlayIconProps = SVGProps<SVGSVGElement>;

export function AudioPlayIcon({ className, ...props }: AudioPlayIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M360-272.31v-415.38L686.15-480 360-272.31Z" />
    </svg>
  );
}

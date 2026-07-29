import type { SVGProps } from "react";

type SkipNextIconProps = SVGProps<SVGSVGElement>;

export function SkipNextIcon({ className, ...props }: SkipNextIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z" />
    </svg>
  );
}

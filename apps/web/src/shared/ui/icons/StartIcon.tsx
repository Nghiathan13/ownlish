import type { SVGProps } from "react";
type StartIconProps = SVGProps<SVGSVGElement>;

export function StartIcon({ className, ...props }: StartIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
    </svg>
  );
}

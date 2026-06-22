import type { SVGProps } from "react";
type RemoveIconProps = SVGProps<SVGSVGElement>;

export function RemoveIcon({ className, ...props }: RemoveIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M200-440v-80h560v80H200Z" />
    </svg>
  );
}

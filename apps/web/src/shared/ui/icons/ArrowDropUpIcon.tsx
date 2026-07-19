import type { SVGProps } from "react";

type ArrowDropUpIconProps = SVGProps<SVGSVGElement>;

export function ArrowDropUpIcon({ className, ...props }: ArrowDropUpIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="m280-400 200-200 200 200H280Z" />
    </svg>
  );
}

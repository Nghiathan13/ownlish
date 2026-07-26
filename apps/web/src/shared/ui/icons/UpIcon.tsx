import type { SVGProps } from "react";

type UpIconProps = SVGProps<SVGSVGElement>;

export function UpIcon({ className, ...props }: UpIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="m480-555.69-184 184L267.69-400 480-612.31 692.31-400 664-371.69l-184-184Z" />
    </svg>
  );
}

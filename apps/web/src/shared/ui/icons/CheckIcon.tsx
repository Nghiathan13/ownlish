import type { SVGProps } from "react";
import { classNames } from "@/shared/lib/classNames";

type CheckIconProps = SVGProps<SVGSVGElement>;

export function CheckIcon({ className, ...props }: CheckIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={classNames("block size-3.5 shrink-0", className)}
      {...props}
    >
      <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
    </svg>
  );
}

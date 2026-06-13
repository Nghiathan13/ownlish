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
      <path d="M382-253.85 168.62-467.23 211.38-510 382-339.38 748.62-706l42.76 42.77L382-253.85Z" />
    </svg>
  );
}

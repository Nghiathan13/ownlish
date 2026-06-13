import type { SVGProps } from "react";
import { classNames } from "@/shared/lib/classNames";

type RemoveIconProps = SVGProps<SVGSVGElement>;

export function RemoveIcon({ className, ...props }: RemoveIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={classNames("block size-3.5 shrink-0", className)}
      {...props}
    >
      <path d="M220-450v-60h520v60H220Z" />
    </svg>
  );
}

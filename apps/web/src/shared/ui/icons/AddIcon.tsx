import type { SVGProps } from "react";
import { classNames } from "@/shared/lib/classNames";

type AddIconProps = SVGProps<SVGSVGElement>;

export function AddIcon({ className, ...props }: AddIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={classNames("block size-3.5 shrink-0", className)}
      {...props}
    >
      <path d="M440-120v-320H120v-80h320v-320h80v320h320v80H520v320h-80Z" />
    </svg>
  );
}

import type { SVGProps } from "react";
import { classNames } from "@/shared/lib/classNames";

type CloseIconProps = SVGProps<SVGSVGElement>;

export function CloseIcon({ className, ...props }: CloseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={classNames("block size-3.5 shrink-0", className)}
      {...props}
    >
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
  );
}

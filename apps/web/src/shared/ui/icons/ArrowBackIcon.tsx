import type { SVGProps } from "react";
import { classNames } from "@/shared/lib/classNames";

type ArrowBackIconProps = SVGProps<SVGSVGElement>;

export function ArrowBackIcon({ className, ...props }: ArrowBackIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={classNames("block size-3.5 shrink-0", className)}
      {...props}
    >
      <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
    </svg>
  );
}

import type { SVGProps } from "react";

type TestsNavFillIconProps = SVGProps<SVGSVGElement>;

export function TestsNavFillIcon({
  className,
  ...props
}: TestsNavFillIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M224.62-160q-27.62 0-46.12-18.5Q160-197 160-224.62v-510.76q0-27.62 18.5-46.12Q197-800 224.62-800h510.76q27.62 0 46.12 18.5Q800-763 800-735.38v510.76q0 27.62-18.5 46.12Q763-160 735.38-160H224.62ZM300-300h240v-40H300v40Zm0-160h360v-40H300v40Zm0-160h360v-40H300v40Z" />
    </svg>
  );
}

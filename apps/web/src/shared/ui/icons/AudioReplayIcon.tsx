import type { SVGProps } from "react";

type AudioReplayIconProps = SVGProps<SVGSVGElement>;

export function AudioReplayIcon({ className, ...props }: AudioReplayIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M355.27-145.04q-58.19-25.04-101.69-68.54-43.5-43.5-68.54-101.66Q160-373.4 160-440h40q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-15.23l65.08 65.08-28.31 28.77-113.85-114.62 115.39-114.62 28.3 28.77L464.77-760H480q66.6 0 124.76 25.04 58.16 25.04 101.66 68.54 43.5 43.5 68.54 101.65Q800-506.63 800-440.04q0 66.58-25.04 124.77t-68.54 101.69q-43.5 43.5-101.65 68.54Q546.63-120 480.04-120q-66.58 0-124.77-25.04Zm37.04-187.27v-35.38h120v-56.93h-120v-123.07h155.38v35.38h-120v56.93H520q11.77 0 19.73 7.96 7.96 7.96 7.96 19.73V-360q0 11.77-7.96 19.73-7.96 7.96-19.73 7.96H392.31Z" />
    </svg>
  );
}

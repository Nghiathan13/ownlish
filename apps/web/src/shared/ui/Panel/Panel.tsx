import type { HTMLAttributes } from "react";
import { classNames } from "@/shared/lib/classNames";

type PanelProps = HTMLAttributes<HTMLElement>;

export function Panel({ className, ...props }: PanelProps) {
  return (
    <section
      className={classNames("rounded-xl border border-border p-8", className)}
      {...props}
    />
  );
}

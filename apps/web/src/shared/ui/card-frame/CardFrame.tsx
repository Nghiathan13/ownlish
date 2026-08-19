import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

type CardFrameProps = {
  children: ReactNode;
  className?: string;
};

export function CardFrame({ children, className }: CardFrameProps) {
  return (
    <div
      className={classNames(
        "grid gap-4 px-4 mb-4 lg:px-16 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

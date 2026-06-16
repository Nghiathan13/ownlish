import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { APP_MAIN_CLASS } from "@/shared/ui/layout";

type PageShellProps = {
  centered?: boolean;
  children: ReactNode;
  className?: string;
  fillViewport?: boolean;
};

export function PageShell({
  centered = false,
  children,
  className,
  fillViewport = false,
}: PageShellProps) {
  return (
    <main
      className={classNames(
        APP_MAIN_CLASS,
        "flex min-h-0 flex-1 flex-col",
        fillViewport ? "overflow-hidden" : "overflow-y-auto",
        centered && "grid place-items-center",
        className,
      )}
    >
      {children}
    </main>
  );
}

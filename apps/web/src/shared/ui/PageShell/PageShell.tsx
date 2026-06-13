import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

type PageShellProps = {
  centered?: boolean;
  children: ReactNode;
  className?: string;
};

export function PageShell({
  centered = false,
  children,
  className,
}: PageShellProps) {
  return (
    <main
      className={classNames(
        APP_CONTAINER_CLASS,
        "py-6 sm:py-8",
        centered && "flex-1 grid place-items-center",
        className,
      )}
    >
      {children}
    </main>
  );
}

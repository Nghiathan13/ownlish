import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

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
        "mx-auto w-full max-w-[992px] px-4 py-16",
        centered && "grid min-h-screen place-items-center",
        className,
      )}
    >
      {children}
    </main>
  );
}

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { APP_MAIN_CLASS } from "@/shared/ui/layout";

type PageShellProps = {
  bleed?: boolean;
  centered?: boolean;
  children: ReactNode;
  className?: string;
  fillViewport?: boolean;
};

export function PageShell({
  bleed = false,
  centered = false,
  children,
  className,
  fillViewport = false,
}: PageShellProps) {
  return (
    <main
      className={classNames(
        APP_MAIN_CLASS,
        "flex min-h-0 flex-1 flex-col py-4",
        fillViewport ? "overflow-hidden" : "overflow-y-auto",
        centered && "grid place-items-center",
        className,
      )}
    >
      <div
        className={classNames(
          "flex min-h-0 flex-1 flex-col",
          !bleed && "px-4",
          centered && "w-full",
        )}
      >
        {children}
      </div>
    </main>
  );
}

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

type PageHeaderProps = {
  children: ReactNode;
  className?: string;
};

/** Shared page-level header layout; pages supply their own navigation state. */
export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <header className={classNames("mt-3 px-4 lg:mt-6 lg:px-16", className)}>
      {children}
    </header>
  );
}

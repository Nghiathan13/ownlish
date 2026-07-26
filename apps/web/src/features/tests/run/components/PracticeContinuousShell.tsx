import type { ReactNode } from "react";
import { PageShell } from "@/shared/ui/PageShell";

type PracticeContinuousShellProps = {
  children: ReactNode;
  navigation: ReactNode;
};

export function PracticeContinuousShell({
  children,
  navigation,
}: PracticeContinuousShellProps) {
  return (
    <PageShell fillViewport>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <div className="relative z-50 shrink-0 border-t border-border bg-surface p-4">
          {navigation}
        </div>
      </div>
    </PageShell>
  );
}

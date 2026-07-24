import type { ReactNode } from "react";
import { PageShell } from "@/shared/ui/PageShell";

type ReviewWorkspaceProps = {
  children: ReactNode;
  header: ReactNode;
};

type ReviewWorkspaceRowProps = {
  children: ReactNode;
  navigation: ReactNode;
  rail?: ReactNode;
};

export function ReviewWorkspaceRow({
  children,
  navigation,
  rail,
}: ReviewWorkspaceRowProps) {
  return (
    <div className="mb-4 grid min-w-0 grid-cols-1 gap-4 px-4 lg:mb-8 lg:grid-cols-[200px_minmax(0,48rem)_84px] lg:items-start lg:px-16">
      {navigation}
      <div className="grid min-w-0 content-start gap-4">{children}</div>
      {rail}
    </div>
  );
}

export function ReviewWorkspace({ children, header }: ReviewWorkspaceProps) {
  return (
    <PageShell>
      <div className="my-4 flex flex-wrap items-center gap-4 px-4 lg:my-8 lg:px-16">
        {header}
      </div>
      {children}
    </PageShell>
  );
}

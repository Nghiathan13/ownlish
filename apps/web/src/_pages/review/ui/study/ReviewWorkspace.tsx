import type { ReactNode } from "react";
import { PageShell } from "@/shared/ui/PageShell";

type ReviewWorkspaceProps = {
  children: ReactNode;
  header: ReactNode;
};

type ReviewWorkspaceRowProps = {
  children: ReactNode;
  navigation: ReactNode;
};

/** Min width of the 3-col block: 200 + 48rem card + 200 + 2×gap-6 = 1216px. */
export const REVIEW_WORKSPACE_ROW_MIN_WIDTH_PX = 1216;

export function ReviewWorkspaceRow({
  children,
  navigation,
}: ReviewWorkspaceRowProps) {
  return (
    <div className="@container/review-row mb-4 min-w-0 px-4 lg:mb-8 lg:px-16">
      <div className="grid min-w-0 grid-cols-1 items-start gap-3 lg:gap-6 @min-[1216px]/review-row:grid-cols-[200px_minmax(0,1fr)_200px]">
        <div className="min-w-0 @min-[1216px]/review-row:w-[200px]">
          {navigation}
        </div>
        <div className="mx-auto grid w-full min-w-0 max-w-[48rem] content-start gap-4">
          {children}
        </div>
        <div
          aria-hidden
          className="hidden @min-[1216px]/review-row:block @min-[1216px]/review-row:w-[200px]"
        />
      </div>
    </div>
  );
}

export function ReviewWorkspace({ children, header }: ReviewWorkspaceProps) {
  return (
    <PageShell>
      <div className="my-3 flex flex-col gap-4 px-4 lg:my-6 lg:px-16">
        {header}
      </div>
      {children}
    </PageShell>
  );
}

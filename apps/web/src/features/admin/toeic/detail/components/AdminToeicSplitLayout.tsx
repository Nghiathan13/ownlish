import type { ReactNode } from "react";

type AdminToeicSplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export function AdminToeicSplitLayout({
  left,
  right,
}: AdminToeicSplitLayoutProps) {
  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-border">
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:pr-4">
        {left}
      </div>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:pl-4">
        {right}
      </div>
    </div>
  );
}

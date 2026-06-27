import type { ReactNode } from "react";

type PracticeSplitPlainLayoutProps = {
  left: ReactNode;
  navigation?: ReactNode;
  right: ReactNode;
};

export function PracticeSplitPlainLayout({
  left,
  navigation,
  right,
}: PracticeSplitPlainLayoutProps) {
  return (
    <>
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:divide-x lg:divide-border">
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          {left}
        </div>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          {right}
        </div>
      </div>
      {navigation != null ? (
        <div className="shrink-0 border-t border-border p-4">{navigation}</div>
      ) : null}
    </>
  );
}

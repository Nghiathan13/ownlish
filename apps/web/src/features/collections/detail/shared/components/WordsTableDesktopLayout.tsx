"use client";

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";

const TABLE_CLASS_NAME =
  "w-full min-w-[920px] table-fixed border-collapse text-left text-base";

type WordsTableDesktopLayoutProps = {
  body: ReactNode;
  className?: string;
  head: ReactNode;
};

export function WordsTableDesktopLayout({
  body,
  className,
  head,
}: WordsTableDesktopLayoutProps) {
  return (
    <div
      className={classNames(
        "mx-4 mb-4 hidden h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface dark:bg-[#000000] lg:flex",
        className,
      )}
    >
      <OverlayScrollArea
        className="h-full min-h-0"
        rootClassName="min-h-0 flex-1"
      >
        <table className={TABLE_CLASS_NAME}>
          {head}
          <tbody>{body}</tbody>
        </table>
      </OverlayScrollArea>
    </div>
  );
}

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

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
        "mx-4 mb-4 hidden h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-surface shadow-card lg:flex dark:border dark:border-border",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <table className={TABLE_CLASS_NAME}>
          {head}
          <tbody>{body}</tbody>
        </table>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

type PracticeTranslationCardProps = {
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  title?: string;
};

export function PracticeTranslationCard({
  children,
  className,
  headerAction,
  title = "Translation",
}: PracticeTranslationCardProps) {
  return (
    <div
      className={classNames(
        "rounded-xl border border-border bg-muted/40 text-base text-foreground select-text",
        className,
      )}
    >
      <div className="flex items-center gap-4 p-4">
        <p className="font-semibold">{title}</p>
        {headerAction}
      </div>
      <div className="border-t border-border" />
      <div className="flex flex-col gap-2 p-4">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

type PracticeTranslationCardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function PracticeTranslationCard({
  children,
  className,
  title = "Translation",
}: PracticeTranslationCardProps) {
  return (
    <div
      className={classNames(
        "flex flex-col gap-8 rounded-xl border border-border bg-muted/40 p-4 text-base text-foreground select-text",
        className,
      )}
    >
      <div>
        <p className="font-semibold">{title}</p>
      </div>
      <div className="-mx-4 border-t border-border px-4">{children}</div>
    </div>
  );
}

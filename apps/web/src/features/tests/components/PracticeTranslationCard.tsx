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
        "rounded-xl border border-border bg-muted/40 text-base text-foreground select-text",
        className,
      )}
    >
      <div className="p-4">
        <p className="font-semibold">{title}</p>
      </div>
      <div className="flex items-center">
        <div className="h-px w-full bg-border" />
      </div>
      <div className="flex flex-col gap-2 p-4">{children}</div>
    </div>
  );
}

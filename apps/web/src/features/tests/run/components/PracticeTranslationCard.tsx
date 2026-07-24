"use client";

import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";

type PracticeTranslationCardProps = {
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  showHeader?: boolean;
  title?: string;
};

export function PracticeTranslationCard({
  children,
  className,
  headerAction,
  showHeader = true,
  title,
}: PracticeTranslationCardProps) {
  const t = useT();
  const resolvedTitle = title ?? t("tests.translation");

  return (
    <div
      className={classNames(
        "rounded-xl border border-border bg-surface text-base text-foreground select-text",
        className,
      )}
    >
      {showHeader ? (
        <>
          <div className="flex items-center gap-4 p-4">
            <p className="font-semibold">{resolvedTitle}</p>
            {headerAction}
          </div>
          <div className="border-t border-border" />
        </>
      ) : null}
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

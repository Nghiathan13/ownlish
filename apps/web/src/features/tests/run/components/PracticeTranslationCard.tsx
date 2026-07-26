"use client";

import { useState, type ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { DownIcon } from "@/shared/ui/icons/DownIcon";
import { UpIcon } from "@/shared/ui/icons/UpIcon";

export const practiceSurfaceFrameClassName =
  "rounded-xl bg-surface text-base text-foreground shadow-card select-text dark:border dark:border-border";

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
  const [isOpen, setIsOpen] = useState(true);
  const resolvedTitle = title ?? t("tests.translation");

  return (
    <div className={classNames(practiceSurfaceFrameClassName, className)}>
      {showHeader ? (
        <>
          <div
            aria-expanded={isOpen}
            className="flex w-full cursor-pointer items-center gap-4 p-4"
            onClick={() => setIsOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsOpen((current) => !current);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex min-w-0 items-center gap-4">
              <p className="flex items-center font-semibold leading-5">
                {resolvedTitle}
              </p>
              {headerAction ? (
                <span
                  className="inline-flex shrink-0 items-center"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  {headerAction}
                </span>
              ) : null}
            </div>
            {isOpen ? (
              <UpIcon className="ml-auto size-5 shrink-0 text-muted-foreground" />
            ) : (
              <DownIcon className="ml-auto size-5 shrink-0 text-muted-foreground" />
            )}
          </div>
          {isOpen ? <div className="border-t border-border" /> : null}
        </>
      ) : null}
      {!showHeader || isOpen ? (
        <div className="flex flex-col gap-4">{children}</div>
      ) : null}
    </div>
  );
}

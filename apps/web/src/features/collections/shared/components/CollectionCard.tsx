import Link from "next/link";
import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

type CollectionCardProps = {
  badge?: string | null;
  footerAction?: ReactNode;
  headerAction?: ReactNode;
  href?: string | null;
  isDisabled?: boolean;
  title: string;
  wordCountLabel: string;
};

export function CollectionCard({
  badge = null,
  footerAction,
  headerAction,
  href = null,
  isDisabled = false,
  title,
  wordCountLabel,
}: CollectionCardProps) {
  const hasFooter = footerAction != null;
  const hasHeaderAction = headerAction != null;
  const contentClassName = classNames(
    "flex flex-col gap-2 p-4",
    hasFooter && "pb-14",
    hasHeaderAction && "pr-12",
  );

  if (isDisabled || !href) {
    return (
      <article className="rounded-xl border border-border p-4 opacity-50">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge ? (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold">{wordCountLabel}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-border">
      {headerAction ? (
        <div className="absolute right-4 top-4 z-10">{headerAction}</div>
      ) : null}
      <Link className="block rounded-xl hover:bg-muted" href={href}>
        <div className={contentClassName}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge ? (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold">{wordCountLabel}</p>
        </div>
      </Link>
      {footerAction ? (
        <div className="absolute bottom-4 right-4 z-10">{footerAction}</div>
      ) : null}
    </article>
  );
}

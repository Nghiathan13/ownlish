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
  const contentClassName = classNames(
    hasFooter ? "p-4 pb-14" : "p-4",
    headerAction ? "pr-10" : undefined,
  );

  if (isDisabled || !href) {
    return (
      <article className="rounded-xl border border-border p-4 opacity-50">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          {badge ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-5 text-sm font-semibold">{wordCountLabel}</p>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-border">
      {headerAction ? (
        <div className="absolute right-3 top-3 z-10">{headerAction}</div>
      ) : null}
      <Link className="block rounded-xl hover:bg-muted" href={href}>
        <div className={contentClassName}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{title}</h2>
            {badge ? (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-5 text-sm font-semibold">{wordCountLabel}</p>
        </div>
      </Link>
      {footerAction ? (
        <div className="absolute bottom-4 right-4 z-10">{footerAction}</div>
      ) : null}
    </article>
  );
}

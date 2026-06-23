import Link from "next/link";
import type { ReactNode } from "react";

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
      <div className="relative z-10 flex flex-col gap-2 p-4 pointer-events-none">
        <div className="flex items-start gap-3">
          <h2 className="min-w-0 flex-1 text-lg font-semibold">{title}</h2>
          {badge ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          ) : null}
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
        <p className="text-sm font-semibold">{wordCountLabel}</p>
        {footerAction ? (
          <div className="flex justify-end">{footerAction}</div>
        ) : null}
      </div>
      <Link
        aria-label={`Open ${title}`}
        className="absolute inset-0 rounded-xl hover:bg-muted"
        href={href}
      />
    </article>
  );
}

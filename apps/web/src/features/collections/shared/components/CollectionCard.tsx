import Link from "next/link";
import type { ReactNode } from "react";

type CollectionCardProps = {
  badge?: string | null;
  description?: string | null;
  footerAction?: ReactNode;
  headerAction?: ReactNode;
  href?: string | null;
  isDisabled?: boolean;
  title: string;
  wordCountLabel: string;
};

export function CollectionCard({
  badge = null,
  description = null,
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
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h2 className="text-lg font-semibold">{title}</h2>
              {description ? (
                <p className="text-base text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {badge ? (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-base">{wordCountLabel}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-border">
      <div className="relative z-10 flex flex-col gap-4 p-4 pointer-events-none">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="text-base text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {badge ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          ) : null}
          {headerAction ?? null}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base">{wordCountLabel}</p>
          {footerAction ? <div className="shrink-0">{footerAction}</div> : null}
        </div>
      </div>
      <Link
        aria-label={`Open ${title}`}
        className="absolute inset-0 rounded-xl hover:bg-muted"
        href={href}
      />
    </article>
  );
}

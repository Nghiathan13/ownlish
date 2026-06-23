import Link from "next/link";
import type { ReactNode } from "react";
import { CalenderIcon } from "@/shared/ui/icons/CalenderIcon";

type CollectionCardProps = {
  badge?: string | null;
  createdLabel?: string | null;
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
  createdLabel = null,
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
          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h2 className="text-lg font-semibold">{title}</h2>
              {createdLabel ? (
                <CollectionCardCreatedLabel label={createdLabel} />
              ) : null}
            </div>
            {badge ? (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-base text-muted-foreground">{description}</p>
          ) : null}
          <CollectionCardWordCount label={wordCountLabel} />
        </div>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-border hover:border-foreground">
      <div className="relative z-10 flex flex-col gap-4 p-4 pointer-events-none">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {createdLabel ? (
              <CollectionCardCreatedLabel label={createdLabel} />
            ) : null}
          </div>
          {badge ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          ) : null}
          {headerAction ?? null}
        </div>
        {description ? (
          <p className="text-base text-muted-foreground">{description}</p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <CollectionCardWordCount label={wordCountLabel} />
          {footerAction ? <div className="shrink-0">{footerAction}</div> : null}
        </div>
      </div>
      <Link
        aria-label={`Open ${title}`}
        className="absolute inset-0 rounded-xl"
        href={href}
      />
    </article>
  );
}

function CollectionCardCreatedLabel({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <CalenderIcon className="block size-4 shrink-0" />
      <span className="leading-none">{label}</span>
    </p>
  );
}

function CollectionCardWordCount({ label }: { label: string }) {
  const wordsSuffix = " words";

  if (!label.endsWith(wordsSuffix)) {
    return <p className="text-base whitespace-nowrap">{label}</p>;
  }

  return (
    <p className="text-base whitespace-nowrap">
      {label.slice(0, -wordsSuffix.length)}
      <span className="text-muted-foreground">{wordsSuffix}</span>
    </p>
  );
}

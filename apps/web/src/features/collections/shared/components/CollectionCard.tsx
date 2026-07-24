"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { collectionListCardClassName } from "@/features/collections/shared/lib/collectionListCard";
import { formatMessage } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
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
  const t = useT();
  const isInteractive = Boolean(href) && !isDisabled;

  return (
    <article
      className={classNames(
        collectionListCardClassName,
        !isInteractive && "opacity-50",
      )}
    >
      {isInteractive ? (
        <Link
          aria-label={formatMessage(t("collections.openCollection"), { title })}
          className="absolute inset-0 rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          href={href!}
        />
      ) : null}

      <div className="pointer-events-none relative flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge ? (
              <span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                {badge}
              </span>
            ) : null}
          </div>
          {headerAction ?? null}
        </div>

        {createdLabel ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalenderIcon className="block size-4 shrink-0" />
            <span className="leading-none">{createdLabel}</span>
          </div>
        ) : null}

        {description ? (
          <div className="text-base text-muted-foreground">{description}</div>
        ) : null}
      </div>

      <div className="relative z-10 mt-auto flex items-center gap-3">
        <div
          className={classNames(
            "min-w-0",
            footerAction ? "flex-1" : "w-full",
          )}
        >
          <CollectionCardWordCount label={wordCountLabel} />
        </div>
        {footerAction ? (
          <div className="w-1/2 shrink-0">{footerAction}</div>
        ) : null}
      </div>
    </article>
  );
}

function CollectionCardWordCount({ label }: { label: string }) {
  const t = useT();
  const wordsSuffix = ` ${t("collections.words")}`;

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

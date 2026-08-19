"use client";

import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";

export type PillTabItem<Key extends string = string> = {
  href: string;
  key: Key;
  label: string;
};

type PillTabsProps<Key extends string> = {
  activeKey: Key;
  ariaLabel: string;
  className?: string;
  items: PillTabItem<Key>[];
  onTabChange?: (key: Key) => void;
};

const pillTabClassName =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getPillTabClassName(isActive: boolean) {
  return classNames(
    pillTabClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-surface-subtle text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
  );
}

export function PillTabs<Key extends string>({
  activeKey,
  ariaLabel,
  className,
  items,
  onTabChange,
}: PillTabsProps<Key>) {
  return (
    <div
      aria-label={ariaLabel}
      className={classNames(
        "mx-4 my-4 flex w-fit max-w-[calc(100%-2rem)] shrink-0 gap-3 overflow-x-auto lg:mx-16 lg:max-w-[calc(100%-8rem)]",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return onTabChange ? (
          <button
            aria-current={isActive ? "page" : undefined}
            aria-selected={isActive}
            className={getPillTabClassName(isActive)}
            key={item.key}
            onClick={() => onTabChange(item.key)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ) : (
          <Link
            aria-current={isActive ? "page" : undefined}
            aria-selected={isActive}
            className={getPillTabClassName(isActive)}
            href={item.href}
            key={item.key}
            role="tab"
            scroll={false}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

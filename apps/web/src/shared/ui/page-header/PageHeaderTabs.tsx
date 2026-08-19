"use client";

import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";

export type PageHeaderTabItem<Key extends string = string> = {
  href: string;
  key: Key;
  label: string;
};

type PageHeaderTabsProps<Key extends string> = {
  activeKey: Key;
  ariaLabel: string;
  className?: string;
  items: PageHeaderTabItem<Key>[];
  onTabChange?: (key: Key) => void;
};

export function PageHeaderTabs<Key extends string>({
  activeKey,
  ariaLabel,
  className,
  items,
  onTabChange,
}: PageHeaderTabsProps<Key>) {
  return (
    <div className={classNames("relative", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-4 -right-4 z-0 h-[0.5px] bg-border lg:-left-16 lg:-right-16"
      />
      <div
        aria-label={ariaLabel}
        className="relative z-10 flex items-end gap-9 overflow-x-auto pl-3"
        role="tablist"
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const tabClassName = classNames(
            "group/page-header-tab relative inline-flex shrink-0 cursor-pointer pb-3 text-base font-normal",
            isActive ? "text-foreground" : "text-muted-foreground",
          );
          const underline = (
            <span
              aria-hidden
              className={classNames(
                "absolute -right-3 -left-3 bottom-[1px] h-[2.5px]",
                isActive
                  ? "bg-foreground"
                  : "bg-transparent group-hover/page-header-tab:bg-border",
              )}
            />
          );

          return onTabChange ? (
            <button
              aria-current={isActive ? "page" : undefined}
              aria-selected={isActive}
              className={tabClassName}
              key={item.key}
              onClick={() => onTabChange(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
              {underline}
            </button>
          ) : (
            <Link
              aria-current={isActive ? "page" : undefined}
              aria-selected={isActive}
              className={tabClassName}
              href={item.href}
              key={item.key}
              role="tab"
              scroll={false}
            >
              {item.label}
              {underline}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

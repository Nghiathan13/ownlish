"use client";

import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";

export type UnderlineTabItem = {
  href: string;
  key: string;
  label: string;
};

type UnderlineTabsProps = {
  activeKey: string;
  ariaLabel: string;
  className?: string;
  items: UnderlineTabItem[];
};

export function UnderlineTabs({
  activeKey,
  ariaLabel,
  className,
  items,
}: UnderlineTabsProps) {
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

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              aria-selected={isActive}
              className={classNames(
                "group/underline-tab relative inline-flex shrink-0 cursor-pointer pb-3 text-base font-normal",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
              href={item.href}
              key={item.key}
              role="tab"
              scroll={false}
            >
              {item.label}
              <span
                aria-hidden
                className={classNames(
                  "absolute -right-3 -left-3 bottom-[1px] h-[2.5px]",
                  isActive
                    ? "bg-foreground"
                    : "bg-transparent group-hover/underline-tab:bg-border",
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { classNames } from "@/shared/lib/classNames";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

export type ReviewSideNavigationItem = {
  href: string;
  id: string;
  isActive: boolean;
  label: string;
};

type ReviewSideNavigationProps = {
  ariaLabel: string;
  emptyLabel: string;
  items: ReviewSideNavigationItem[];
  itemsClassName?: string;
  loading: boolean;
  /** Persist/restore list scroll across part navigations (e.g. Oxford band). */
  scrollKey?: string;
  widthClassName?: string;
};

export function ReviewSideNavigation({
  ariaLabel,
  emptyLabel,
  items,
  itemsClassName = "grid-cols-1",
  loading,
  scrollKey,
  widthClassName = "lg:w-[200px]",
}: ReviewSideNavigationProps) {
  const router = useRouter();
  const hasItems = !loading && items.length > 0;
  const listRef = useRef<HTMLDivElement>(null);
  const activeItem = items.find((item) => item.isActive) ?? items[0] ?? null;

  // Keep the active Oxford part centered when there is enough scroll space.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || scrollKey == null || loading || !hasItems) {
      return;
    }

    const activeLink = list.querySelector<HTMLAnchorElement>(
      '[aria-current="page"]',
    );
    if (!activeLink) {
      return;
    }

    const centeredScrollTop =
      activeLink.offsetTop -
      (list.clientHeight - activeLink.offsetHeight) / 2;
    const maxScrollTop = list.scrollHeight - list.clientHeight;
    list.scrollTop = Math.min(
      Math.max(0, centeredScrollTop),
      Math.max(0, maxScrollTop),
    );
  }, [activeItem?.id, hasItems, loading, scrollKey]);

  return (
    <>
      <div className="w-[200px] lg:hidden">
        {loading ? (
          <div
            aria-label={`Loading ${ariaLabel}`}
            className="h-10 animate-pulse rounded-lg bg-muted"
          />
        ) : hasItems && activeItem ? (
          <SelectDropdown
            ariaLabel={ariaLabel}
            className="w-[200px]"
            onChange={(itemId) => {
              const nextItem = items.find((item) => item.id === itemId);
              if (!nextItem || nextItem.id === activeItem.id) {
                return;
              }

              router.push(nextItem.href, { scroll: false });
            }}
            options={items.map((item) => ({
              label: item.label,
              value: item.id,
            }))}
            value={activeItem.id}
          />
        ) : (
          <p className="rounded-lg bg-surface px-4 py-2.5 text-center text-sm text-muted-foreground shadow-card dark:border dark:border-border">
            {emptyLabel}
          </p>
        )}
      </div>

      <nav
        aria-label={ariaLabel}
        className={classNames(
          "hidden max-h-[480px] w-full shrink-0 flex-col overflow-hidden rounded-lg bg-surface p-1 shadow-card lg:sticky lg:top-4 lg:flex lg:self-start dark:border dark:border-border",
          widthClassName,
        )}
      >
        <div
          className={classNames(
            "min-h-0 flex-1 overflow-y-auto",
            loading || hasItems
              ? classNames("grid content-start gap-1", itemsClassName)
              : "grid place-items-center",
          )}
          ref={listRef}
        >
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <div
                  aria-label={`Loading ${ariaLabel}`}
                  className="h-8 animate-pulse rounded-md bg-muted"
                  key={index}
                />
              ))
            : hasItems
              ? items.map((item) => (
                  <Link
                    aria-current={item.isActive ? "page" : undefined}
                    className={classNames(
                      "block rounded-md px-3 py-2 text-left text-base font-normal text-foreground",
                      "hover:bg-hover-overlay",
                      item.isActive && "bg-muted",
                    )}
                    href={item.href}
                    key={item.id}
                    prefetch={false}
                    scroll={false}
                  >
                    {item.label}
                  </Link>
                ))
              : (
                  <p className="px-3 py-2 text-center text-sm text-muted-foreground">
                    {emptyLabel}
                  </p>
                )}
        </div>
      </nav>
    </>
  );
}

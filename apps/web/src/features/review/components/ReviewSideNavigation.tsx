"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  onNavigate?: (item: ReviewSideNavigationItem) => void;
  scrollKey?: string;
  widthClassName?: string;
};

type OverlayThumb = {
  height: number;
  top: number;
};

function shouldHandleReviewNavigation(event: ReactMouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

function getOverlayThumb(list: HTMLDivElement): OverlayThumb | null {
  const { clientHeight, scrollHeight, scrollTop } = list;
  if (scrollHeight <= clientHeight + 1) {
    return null;
  }

  const height = Math.max(28, (clientHeight / scrollHeight) * clientHeight);
  const maxTop = clientHeight - height;
  const top =
    maxTop <= 0
      ? 0
      : (scrollTop / (scrollHeight - clientHeight)) * maxTop;

  return { height, top };
}

export function ReviewSideNavigation({
  ariaLabel,
  emptyLabel,
  items,
  itemsClassName = "grid-cols-1",
  loading,
  onNavigate,
  scrollKey,
  widthClassName = "lg:w-[200px]",
}: ReviewSideNavigationProps) {
  const router = useRouter();
  const hasItems = !loading && items.length > 0;
  const listRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [thumb, setThumb] = useState<OverlayThumb | null>(null);
  const activeItem = items.find((item) => item.isActive) ?? items[0] ?? null;

  const syncThumb = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      setThumb(null);
      return;
    }

    setThumb(getOverlayThumb(list));
  }, []);

  // Keep the active Oxford part centered when there is enough scroll space.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || scrollKey == null || loading || !hasItems) {
      syncThumb();
      return;
    }

    const activeLink = list.querySelector<HTMLAnchorElement>(
      '[aria-current="page"]',
    );
    if (!activeLink) {
      syncThumb();
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
    syncThumb();
  }, [activeItem?.id, hasItems, loading, scrollKey, syncThumb]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncThumb();
    });
    observer.observe(list);

    return () => observer.disconnect();
  }, [hasItems, loading, syncThumb]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const list = listRef.current;
      if (!list || !thumb) {
        return;
      }

      const rect = list.getBoundingClientRect();
      const maxTop = list.clientHeight - thumb.height;
      const nextTop = Math.min(
        Math.max(0, event.clientY - rect.top - dragOffsetRef.current),
        maxTop,
      );
      const maxScrollTop = list.scrollHeight - list.clientHeight;
      list.scrollTop =
        maxTop <= 0 ? 0 : (nextTop / maxTop) * maxScrollTop;
      syncThumb();
    }

    function handlePointerUp() {
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, syncThumb, thumb]);

  function handleThumbPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const list = listRef.current;
    if (!list || !thumb) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const rect = list.getBoundingClientRect();
    dragOffsetRef.current = event.clientY - rect.top - thumb.top;
    setIsDragging(true);
  }

  const showThumb = Boolean(thumb) && (isHovering || isDragging);

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

              if (onNavigate) {
                onNavigate(nextItem);
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
          <p className="rounded-lg border border-border bg-surface px-4 py-2.5 text-center text-sm text-muted-foreground dark:bg-[#000000]">
            {emptyLabel}
          </p>
        )}
      </div>

      <nav
        aria-label={ariaLabel}
        className={classNames(
          "relative hidden max-h-[480px] w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface p-1 lg:sticky lg:top-4 lg:flex lg:self-start dark:bg-[#000000]",
          widthClassName,
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          if (!isDragging) {
            setIsHovering(false);
          }
        }}
      >
        <div
          className={classNames(
            "overlay-scroll-hide min-h-0 max-h-[480px] flex-1 overflow-y-auto",
            loading || hasItems
              ? classNames("grid content-start gap-1", itemsClassName)
              : "grid place-items-center",
          )}
          onScroll={syncThumb}
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
                      item.isActive
                        ? "bg-[#f0f0f0] hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
                        : "hover:bg-hover-overlay",
                    )}
                    href={item.href}
                    key={item.id}
                    onClick={
                      onNavigate
                        ? (event) => {
                            if (!shouldHandleReviewNavigation(event)) {
                              return;
                            }

                            event.preventDefault();
                            onNavigate(item);
                          }
                        : undefined
                    }
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

        {thumb ? (
          <div
            aria-hidden
            className={classNames(
              "pointer-events-none absolute inset-y-1 right-0 w-3 transition-opacity duration-150",
              showThumb ? "opacity-100" : "opacity-0",
            )}
          >
            <div
              className={classNames(
                "absolute right-0.5 w-1.5 rounded-full bg-foreground/30 hover:bg-foreground/45",
                showThumb ? "pointer-events-auto cursor-grab" : "pointer-events-none",
                isDragging && "cursor-grabbing bg-foreground/45",
              )}
              onPointerDown={handleThumbPointerDown}
              style={{ height: thumb.height, top: thumb.top }}
            />
          </div>
        ) : null}
      </nav>
    </>
  );
}

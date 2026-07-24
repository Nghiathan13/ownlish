"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
} from "react";
import { classNames } from "@/shared/lib/classNames";

type OverlayThumb = {
  height: number;
  top: number;
};

type OverlayScrollAreaProps = {
  /** CSS selector for the item to keep centered when the list can scroll. */
  centerSelector?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  rootClassName?: string;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  scrollRef?: (node: HTMLDivElement | null) => void;
};

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

function centerElementInScrollArea(list: HTMLDivElement, element: HTMLElement) {
  const centeredScrollTop =
    element.offsetTop - (list.clientHeight - element.offsetHeight) / 2;
  const maxScrollTop = list.scrollHeight - list.clientHeight;
  list.scrollTop = Math.min(
    Math.max(0, centeredScrollTop),
    Math.max(0, maxScrollTop),
  );
}

export function OverlayScrollArea({
  centerSelector,
  children,
  className,
  contentClassName,
  rootClassName,
  onScroll,
  scrollRef,
}: OverlayScrollAreaProps) {
  const [listNode, setListNode] = useState<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [thumb, setThumb] = useState<OverlayThumb | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const setListRef = useCallback(
    (node: HTMLDivElement | null) => {
      setListNode(node);
      if (!node) {
        setThumb(null);
      }
      scrollRef?.(node);
    },
    [scrollRef],
  );

  const syncThumb = useCallback(() => {
    if (!listNode) {
      return;
    }

    setThumb(getOverlayThumb(listNode));
  }, [listNode]);

  useLayoutEffect(() => {
    if (!listNode) {
      return;
    }

    if (centerSelector) {
      const active = listNode.querySelector(centerSelector);
      if (active instanceof HTMLElement) {
        centerElementInScrollArea(listNode, active);
      }
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        syncThumb();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [centerSelector, children, listNode, syncThumb]);

  useEffect(() => {
    if (!listNode || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncThumb();
    });
    observer.observe(listNode);

    return () => observer.disconnect();
  }, [listNode, syncThumb]);

  useEffect(() => {
    if (!isDragging || !listNode || !thumb) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const maxTop = listNode!.clientHeight - thumb!.height;
      const rect = listNode!.getBoundingClientRect();
      const nextTop = Math.min(
        Math.max(0, event.clientY - rect.top - dragOffset),
        maxTop,
      );
      const maxScrollTop = listNode!.scrollHeight - listNode!.clientHeight;
      listNode!.scrollTop =
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
  }, [dragOffset, isDragging, listNode, syncThumb, thumb]);

  function handleThumbPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!listNode || !thumb) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const rect = listNode.getBoundingClientRect();
    setDragOffset(event.clientY - rect.top - thumb.top);
    setIsDragging(true);
  }

  const showThumb = Boolean(thumb) && (isHovering || isDragging);

  return (
    <div
      className={classNames("relative", rootClassName)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isDragging) {
          setIsHovering(false);
        }
      }}
    >
      <div
        className={classNames(
          "overlay-scroll-hide overflow-auto",
          className,
          contentClassName,
        )}
        onScroll={(event) => {
          syncThumb();
          onScroll?.(event);
        }}
        ref={setListRef}
      >
        {children}
      </div>

      {thumb ? (
        <div
          aria-hidden
          className={classNames(
            "pointer-events-none absolute inset-y-0 right-0 w-3 transition-opacity duration-150",
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
    </div>
  );
}

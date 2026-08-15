"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProgressSource } from "../model/types";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/lib/providers";
import { ChevronRightIcon } from "@/shared/ui/icons";

const PROGRESS_SOURCE_OPTIONS: Array<{
  id: ProgressSource;
  labelKey: "dashboard.myCollection" | "collections.oxford";
}> = [
  { id: "collection", labelKey: "dashboard.myCollection" },
  { id: "oxford", labelKey: "collections.oxford" },
];

function useHoverCapableMenu() {
  const [isHoverCapable, setIsHoverCapable] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    function sync() {
      setIsHoverCapable(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isHoverCapable;
}

export function ProgressSourceMenu({
  onSourceChange,
  source,
}: {
  onSourceChange: (source: ProgressSource) => void;
  source: ProgressSource;
}) {
  const t = useT();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isHoverCapable = useHoverCapableMenu();

  function clearCloseTimer() {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setIsOpen(true);
  }

  function scheduleCloseMenu() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 120);
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      className="relative flex w-fit max-w-full items-center"
      ref={rootRef}
    >
      <span className="min-w-0 truncate text-[21px] leading-8 font-semibold text-foreground">
        {source === "collection"
          ? t("dashboard.myCollection")
          : t("collections.oxford")}
      </span>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("dashboard.switchProgressSource")}
        className={classNames(
          "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground",
          "hover:text-foreground",
          isOpen && "text-foreground",
        )}
        onClick={() => {
          if (isHoverCapable) return;
          setIsOpen((current) => !current);
        }}
        onMouseEnter={isHoverCapable ? openMenu : undefined}
        onMouseLeave={isHoverCapable ? scheduleCloseMenu : undefined}
        type="button"
      >
        <ChevronRightIcon className="size-5" />
      </button>

      {isOpen ? (
        <div
          aria-label={t("dashboard.switchProgressSource")}
          className="absolute top-0 left-full z-20 ml-1 flex min-w-[12rem] flex-col gap-1 rounded-lg border border-border bg-surface-card p-1"
          id={menuId}
          onMouseEnter={isHoverCapable ? openMenu : undefined}
          onMouseLeave={isHoverCapable ? scheduleCloseMenu : undefined}
          role="menu"
        >
          {PROGRESS_SOURCE_OPTIONS.map((option) => {
            const isSelected = source === option.id;

            return (
              <button
                aria-checked={isSelected}
                className={classNames(
                  "relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-left text-[15px] leading-5",
                  "before:pointer-events-none before:absolute before:inset-0 before:rounded-md hover:before:bg-hover-overlay",
                  isSelected && "bg-surface-subtle",
                )}
                key={option.id}
                onClick={() => {
                  onSourceChange(option.id);
                  setIsOpen(false);
                }}
                role="menuitemradio"
                type="button"
              >
                <span className="relative truncate">{t(option.labelKey)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

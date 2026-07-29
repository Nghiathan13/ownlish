"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { ArrowDropDownIcon } from "@/shared/ui/icons/ArrowDropDownIcon";
import { ArrowDropUpIcon } from "@/shared/ui/icons/ArrowDropUpIcon";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";

const CLOSE_DELAY_MS = 150;

type ImportToolbarButtonProps = {
  collections: CollectionSummary[];
  disabled?: boolean;
  label: string;
  onImport: (targetCollectionId: string) => void;
};

export function ImportToolbarButton({
  collections,
  disabled = false,
  label,
  onImport,
}: ImportToolbarButtonProps) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openMenu = () => {
    if (disabled || collections.length === 0) {
      return;
    }

    clearCloseTimeout();
    setIsOpen(true);
  };

  const scheduleCloseMenu = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, CLOSE_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
      className="relative w-fit shrink-0"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleCloseMenu}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("collections.importInto")}
        className={iconTextButtonClassName(
          "w-fit shrink-0 border-success-border bg-success-background text-success hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
        )}
        disabled={disabled || collections.length === 0}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          openMenu();
        }}
        type="button"
      >
        <span>{label}</span>
        {isOpen ? (
          <ArrowDropUpIcon className="size-5 shrink-0" />
        ) : (
          <ArrowDropDownIcon className="size-5 shrink-0" />
        )}
      </button>

      {isOpen ? (
        <div
          aria-label={t("collections.importInto")}
          className="absolute top-[calc(100%+0.5rem)] left-0 z-20 w-max min-w-[12rem] rounded-lg border border-border bg-surface p-1 dark:bg-[#000000]"
          id={menuId}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
          role="menu"
        >
          <OverlayScrollArea
            className="max-h-[calc(5*2.25rem+4*0.25rem)]"
            contentClassName="grid gap-1"
          >
            {collections.map((collection) => (
              <button
                className={classNames(
                  "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-foreground",
                  "hover:bg-hover-overlay",
                )}
                key={collection.id}
                onClick={() => {
                  setIsOpen(false);
                  onImport(collection.id);
                }}
                role="menuitem"
                type="button"
              >
                <span className="truncate">
                  {collection.isDefault
                    ? t("collections.myVocabulary")
                    : collection.name}
                </span>
              </button>
            ))}
          </OverlayScrollArea>
        </div>
      ) : null}
    </div>
  );
}

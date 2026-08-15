"use client";

import {
  FloatingPortal,
} from "@floating-ui/react";
import type { DictionaryEntry } from "@/entities/dictionary";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { ReplayIcon } from "@/shared/ui/icons";
import { iconButtonGroupClassName, Tooltip } from "@/shared/ui/Tooltip";
import { useDictionaryPopoverPositioning } from "../model/useDictionaryPopoverPositioning";
import { DictionaryEntryContent } from "./DictionaryEntryContent";

type DictionaryLookupPopoverProps = {
  entry: DictionaryEntry | null | undefined;
  error: Error | null;
  isLoading: boolean;
  onClose: () => void;
  onPointerDownInside: () => void;
  onRetry: () => void;
  range: Range;
  rootElement: HTMLElement;
  word: string;
};

export function DictionaryLookupPopover({
  entry,
  error,
  isLoading,
  onClose,
  onPointerDownInside,
  onRetry,
  range,
  rootElement,
  word,
}: DictionaryLookupPopoverProps) {
  const t = useT();
  const { floatingProps, floatingStyles, setFloatingElement } = useDictionaryPopoverPositioning({
    onClose,
    range,
    rootElement,
  });

  return (
    <FloatingPortal>
      <section
        aria-label={t("dictionary.title")}
        className="z-[110] flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-border bg-surface-card shadow-xl"
        ref={setFloatingElement}
        role="dialog"
        style={floatingStyles}
        {...floatingProps}
        onFocusCapture={onPointerDownInside}
        onPointerDownCapture={onPointerDownInside}
        onMouseDownCapture={onPointerDownInside}
        onTouchStartCapture={onPointerDownInside}
      >
        {isLoading ? (
          <div aria-live="polite" className="grid gap-3 p-4" role="status">
            <span className="h-6 w-20 animate-pulse rounded bg-surface-subtle" />
            <span className="h-4 w-full animate-pulse rounded bg-surface-subtle" />
            <span className="h-4 w-4/5 animate-pulse rounded bg-surface-subtle" />
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm text-muted-foreground">{t("dictionary.loadError")}</p>
            <button
              aria-label={t("dictionary.retry")}
              className={iconOnlyButtonClassName(
                "relative shrink-0 bg-transparent text-foreground hover:bg-hover-overlay",
                iconButtonGroupClassName,
              )}
              onClick={onRetry}
              type="button"
            >
              <ReplayIcon className="size-5" />
              <Tooltip group="icon-button" placement="bottom">
                {t("dictionary.retry")}
              </Tooltip>
            </button>
          </div>
        ) : null}
        {entry === null ? (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {formatMessage(t("dictionary.notFound"), { word })}
            </p>
          </div>
        ) : null}
        {entry ? (
          <>
            <header className="shrink-0 border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold text-foreground">{entry.word}</h2>
            </header>
            <OverlayScrollArea
              className="min-h-0 flex-1 p-4"
              rootClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <DictionaryEntryContent entry={entry} />
            </OverlayScrollArea>
          </>
        ) : null}
      </section>
    </FloatingPortal>
  );
}

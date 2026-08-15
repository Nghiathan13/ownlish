"use client";

import type { ReactNode } from "react";
import { DICTIONARY_ROOT } from "@/shared/config";
import { useDictionaryLookup } from "../model/useDictionaryLookup";
import { useDictionarySelection } from "../model/useDictionarySelection";
import { DictionaryLookupPopover } from "./DictionaryLookupPopover";

export function DictionaryLookupBoundary({ children }: { children: ReactNode }) {
  const {
    close,
    handleClickCapture,
    handleKeyUpCapture,
    handlePointerDownCapture,
    handlePointerUpCapture,
    handlePopoverPointerDown,
    rootElement,
    selection,
    setRootElement,
  } = useDictionarySelection({
    isConfigured: Boolean(DICTIONARY_ROOT),
  });
  const lookup = useDictionaryLookup(selection?.word ?? null);

  return (
    <div
      className="contents"
      onClickCapture={handleClickCapture}
      onKeyUpCapture={handleKeyUpCapture}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerUpCapture={handlePointerUpCapture}
      ref={setRootElement}
    >
      {children}
      {selection && rootElement ? (
        <DictionaryLookupPopover
          entry={lookup.data}
          error={lookup.error instanceof Error ? lookup.error : null}
          isLoading={lookup.isPending}
          onClose={close}
          onPointerDownInside={handlePopoverPointerDown}
          onRetry={lookup.refetch}
          range={selection.range}
          rootElement={rootElement}
          word={selection.word}
        />
      ) : null}
    </div>
  );
}

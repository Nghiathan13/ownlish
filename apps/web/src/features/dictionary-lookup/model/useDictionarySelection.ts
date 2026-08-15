"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { getDictionarySelectionInsideRoot, type DictionarySelection } from "../lib/getDictionarySelectionInsideRoot";

type UseDictionarySelectionOptions = {
  isConfigured: boolean;
};

export function useDictionarySelection({ isConfigured }: UseDictionarySelectionOptions) {
  const suppressNextClickRef = useRef(false);
  const isInteractingWithPopoverRef = useRef(false);
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<DictionarySelection | null>(null);

  const close = useCallback(() => {
    setSelection(null);
  }, []);

  function isEventInsideRoot(target: EventTarget | null) {
    return target instanceof Node && Boolean(rootElement?.contains(target));
  }

  function updateSelection() {
    if (!rootElement || !isConfigured) {
      close();
      return;
    }

    const nextSelection = getDictionarySelectionInsideRoot(rootElement);
    if (!nextSelection) {
      close();
      return;
    }

    setSelection(nextSelection);
  }

  function handlePointerUpCapture(event: PointerEvent<HTMLDivElement>) {
    if (!isEventInsideRoot(event.target)) {
      return;
    }

    const nextSelection = rootElement ? getDictionarySelectionInsideRoot(rootElement) : null;
    suppressNextClickRef.current = nextSelection !== null;
    updateSelection();
  }

  function handleKeyUpCapture(event: KeyboardEvent<HTMLDivElement>) {
    if (!isEventInsideRoot(event.target)) {
      return;
    }

    if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") {
      updateSelection();
    }
  }

  function handlePointerDownCapture(event: PointerEvent<HTMLDivElement>) {
    if (!isEventInsideRoot(event.target)) {
      return;
    }

    isInteractingWithPopoverRef.current = false;
    suppressNextClickRef.current = false;
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!isEventInsideRoot(event.target) || !suppressNextClickRef.current) {
      return;
    }

    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePopoverPointerDown() {
    isInteractingWithPopoverRef.current = true;
  }

  useEffect(() => {
    function handleSelectionChange() {
      if (isInteractingWithPopoverRef.current || !rootElement) {
        return;
      }

      if (!getDictionarySelectionInsideRoot(rootElement)) {
        close();
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [close, rootElement]);

  return {
    close,
    handleClickCapture,
    handleKeyUpCapture,
    handlePointerDownCapture,
    handlePointerUpCapture,
    handlePopoverPointerDown,
    rootElement,
    selection,
    setRootElement,
  };
}

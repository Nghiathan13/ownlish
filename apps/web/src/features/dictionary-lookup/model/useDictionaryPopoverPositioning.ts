"use client";

import {
  autoUpdate,
  flip,
  offset,
  size,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { useCallback, useLayoutEffect, useMemo } from "react";
import { createRangeVirtualElement } from "../lib/createRangeVirtualElement";
import { dictionaryPopoverHorizontalPlacement } from "../lib/dictionaryPopoverHorizontalPlacement";
import {
  DICTIONARY_POPOVER_MAX_HEIGHT,
  DICTIONARY_POPOVER_VIEWPORT_PADDING,
} from "../lib/dictionaryPopoverPositioning";

type UseDictionaryPopoverPositioningOptions = {
  onClose: () => void;
  range: Range;
  rootElement: HTMLElement;
};

export function useDictionaryPopoverPositioning({
  onClose,
  range,
  rootElement,
}: UseDictionaryPopoverPositioningOptions) {
  const virtualReference = useMemo(
    () => createRangeVirtualElement(range, rootElement),
    [range, rootElement],
  );
  const { context, floatingStyles, refs } = useFloating({
    open: true,
    onOpenChange: (open) => {
      if (!open) {
        onClose();
      }
    },
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(8),
      flip({
        crossAxis: false,
        fallbackPlacements: ["top-start"],
        padding: DICTIONARY_POPOVER_VIEWPORT_PADDING,
      }),
      size({
        padding: DICTIONARY_POPOVER_VIEWPORT_PADDING,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.min(
            DICTIONARY_POPOVER_MAX_HEIGHT,
            Math.max(0, availableHeight),
          )}px`;
        },
      }),
      dictionaryPopoverHorizontalPlacement,
    ],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, {
    ancestorScroll: false,
    outsidePressEvent: "pointerdown",
  });
  const { getFloatingProps } = useInteractions([dismiss]);
  const setFloatingElement = useCallback(
    (element: HTMLElement | null) => {
      refs.setFloating(element);
    },
    [refs],
  );

  useLayoutEffect(() => {
    refs.setPositionReference(virtualReference);
  }, [refs, virtualReference]);

  return {
    floatingProps: getFloatingProps(),
    floatingStyles,
    setFloatingElement,
  };
}

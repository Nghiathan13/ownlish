import { detectOverflow, type Middleware } from "@floating-ui/react";
import { calculatePopoverHorizontalLayout } from "./calculatePopoverHorizontalLayout";
import { DICTIONARY_POPOVER_VIEWPORT_PADDING } from "./dictionaryPopoverPositioning";

function getBaseFloatingWidth(element: HTMLElement) {
  const width = element.style.width;
  if (!width) {
    return element.getBoundingClientRect().width;
  }

  element.style.width = "";
  const baseWidth = element.getBoundingClientRect().width;
  element.style.width = width;
  return baseWidth;
}

export const dictionaryPopoverHorizontalPlacement: Middleware = {
  name: "dictionaryHorizontalPlacement",
  async fn(state) {
    const { elements, rects, x } = state;
    const width = getBaseFloatingWidth(elements.floating);
    const floating = { ...rects.floating, width };
    const rectsWithBaseWidth = { ...rects, floating };
    const startOverflow = await detectOverflow(
      { ...state, rects: rectsWithBaseWidth },
      { padding: DICTIONARY_POPOVER_VIEWPORT_PADDING },
    );
    const endX = x + rects.reference.width - width;
    const endOverflow = await detectOverflow(
      { ...state, rects: rectsWithBaseWidth, x: endX },
      { padding: DICTIONARY_POPOVER_VIEWPORT_PADDING },
    );
    const layout = calculatePopoverHorizontalLayout({
      endOverflow,
      referenceWidth: rects.reference.width,
      startOverflow,
      width,
    });
    const isCentered = layout.width !== width;

    if (!isCentered && elements.floating.style.width) {
      elements.floating.style.width = "";
      return { reset: { rects: true } };
    }

    if (isCentered) {
      const centeredWidth = `${layout.width}px`;
      if (elements.floating.style.width !== centeredWidth) {
        elements.floating.style.width = centeredWidth;
        return { reset: { rects: true } };
      }
    }

    return { x: x + layout.offset };
  },
};

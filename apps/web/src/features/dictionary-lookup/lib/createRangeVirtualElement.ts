import type { VirtualElement } from "@floating-ui/react";

export function createRangeVirtualElement(
  range: Range,
  contextElement: HTMLElement,
): VirtualElement {
  return {
    contextElement,
    getBoundingClientRect: () => range.getBoundingClientRect(),
    getClientRects: () => range.getClientRects(),
  };
}

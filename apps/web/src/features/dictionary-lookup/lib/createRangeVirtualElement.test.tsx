import { describe, expect, it, vi } from "vitest";
import { createRangeVirtualElement } from "./createRangeVirtualElement";

describe("createRangeVirtualElement", () => {
  it("keeps the range geometry live for Floating UI", () => {
    const boundingRect = new DOMRect(12, 24, 36, 48);
    const clientRects = [boundingRect] as unknown as DOMRectList;
    const range = {
      getBoundingClientRect: vi.fn(() => boundingRect),
      getClientRects: vi.fn(() => clientRects),
    } as unknown as Range;
    const contextElement = document.createElement("div");

    const virtualElement = createRangeVirtualElement(range, contextElement);

    expect(virtualElement.contextElement).toBe(contextElement);
    expect(virtualElement.getBoundingClientRect()).toBe(boundingRect);
    expect(virtualElement.getClientRects()).toBe(clientRects);
    expect(range.getBoundingClientRect).toHaveBeenCalledTimes(1);
    expect(range.getClientRects).toHaveBeenCalledTimes(1);
  });
});

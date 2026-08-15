import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  autoUpdate: vi.fn(),
  flip: vi.fn((options) => ({ name: "flip", options })),
  getFloatingProps: vi.fn(() => ({ "data-floating": "true" })),
  offset: vi.fn((value) => ({ name: "offset", value })),
  refs: {
    setFloating: vi.fn(),
    setPositionReference: vi.fn(),
  },
  size: vi.fn((options) => ({ name: "size", options })),
  useDismiss: vi.fn(() => ({ name: "dismiss" })),
  useFloating: vi.fn(),
  useInteractions: vi.fn(),
}));

vi.mock("@floating-ui/react", () => ({
  autoUpdate: mocks.autoUpdate,
  flip: mocks.flip,
  offset: mocks.offset,
  size: mocks.size,
  useDismiss: mocks.useDismiss,
  useFloating: mocks.useFloating,
  useInteractions: mocks.useInteractions,
}));

import { useDictionaryPopoverPositioning } from "./useDictionaryPopoverPositioning";

describe("useDictionaryPopoverPositioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useFloating.mockReturnValue({
      context: { id: "floating-context" },
      floatingStyles: { left: 12, position: "fixed", top: 24 },
      refs: mocks.refs,
    });
    mocks.useInteractions.mockReturnValue({ getFloatingProps: mocks.getFloatingProps });
  });

  it("configures fixed positioning, viewport constraints, and a virtual range reference", () => {
    const range = {
      getBoundingClientRect: vi.fn(() => new DOMRect(16, 32, 20, 24)),
      getClientRects: vi.fn(() => [new DOMRect(16, 32, 20, 24)]),
    } as unknown as Range;
    const rootElement = document.createElement("div");
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDictionaryPopoverPositioning({ onClose, range, rootElement }),
    );

    expect(mocks.offset).toHaveBeenCalledWith(8);
    expect(mocks.flip).toHaveBeenCalledWith({
      crossAxis: false,
      fallbackPlacements: ["top-start"],
      padding: 16,
    });
    expect(mocks.useFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: "bottom-start",
        strategy: "fixed",
        whileElementsMounted: mocks.autoUpdate,
      }),
    );
    expect(mocks.refs.setPositionReference).toHaveBeenCalledWith(
      expect.objectContaining({ contextElement: rootElement }),
    );
    expect(result.current.floatingProps).toEqual({ "data-floating": "true" });
    expect(result.current.floatingStyles).toEqual({ left: 12, position: "fixed", top: 24 });
  });

  it("limits height, sets the floating element, and closes when Floating UI dismisses it", () => {
    const range = {
      getBoundingClientRect: vi.fn(() => new DOMRect()),
      getClientRects: vi.fn(() => []),
    } as unknown as Range;
    const rootElement = document.createElement("div");
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useDictionaryPopoverPositioning({ onClose, range, rootElement }),
    );
    const floatingOptions = mocks.useFloating.mock.calls[0][0];
    const sizeOptions = mocks.size.mock.calls[0][0];
    const floating = document.createElement("div");

    sizeOptions.apply({ availableHeight: 600, elements: { floating } });
    expect(floating.style.maxHeight).toBe("480px");
    sizeOptions.apply({ availableHeight: -10, elements: { floating } });
    expect(floating.style.maxHeight).toBe("0px");

    act(() => result.current.setFloatingElement(floating));
    expect(mocks.refs.setFloating).toHaveBeenCalledWith(floating);

    act(() => floatingOptions.onOpenChange(false));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

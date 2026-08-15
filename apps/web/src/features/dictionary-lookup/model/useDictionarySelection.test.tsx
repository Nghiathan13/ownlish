import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDictionarySelection } from "./useDictionarySelection";

function selectNode(node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function pointerEvent(target: EventTarget) {
  return { target } as React.PointerEvent<HTMLDivElement>;
}

function keyboardEvent(target: EventTarget, key: string) {
  return { key, target } as React.KeyboardEvent<HTMLDivElement>;
}

describe("useDictionarySelection", () => {
  let root: HTMLDivElement;
  let word: HTMLSpanElement;

  beforeEach(() => {
    root = document.createElement("div");
    word = document.createElement("span");
    word.textContent = "A";
    root.append(word);
    document.body.append(root);
  });

  afterEach(() => {
    window.getSelection()?.removeAllRanges();
    document.body.replaceChildren();
  });

  it("stores an in-root pointer selection and suppresses its following click", () => {
    const { result } = renderHook(() => useDictionarySelection({ isConfigured: true }));
    act(() => result.current.setRootElement(root));
    selectNode(word);

    act(() => result.current.handlePointerUpCapture(pointerEvent(word)));

    expect(result.current.selection?.word).toBe("a");
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: word,
    } as unknown as React.MouseEvent<HTMLDivElement>;
    act(() => result.current.handleClickCapture(event));
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
  });

  it("updates only for selection keys and closes when the selection becomes invalid", () => {
    const { result } = renderHook(() => useDictionarySelection({ isConfigured: true }));
    act(() => result.current.setRootElement(root));
    selectNode(word);

    act(() => result.current.handleKeyUpCapture(keyboardEvent(word, "ArrowRight")));
    expect(result.current.selection?.word).toBe("a");

    act(() => result.current.handleKeyUpCapture(keyboardEvent(word, "Enter")));
    expect(result.current.selection?.word).toBe("a");

    window.getSelection()?.removeAllRanges();
    act(() => document.dispatchEvent(new Event("selectionchange")));
    expect(result.current.selection).toBeNull();
  });

  it("keeps the selection while interacting with the popup, then closes after a root pointer down", () => {
    const { result } = renderHook(() => useDictionarySelection({ isConfigured: true }));
    act(() => result.current.setRootElement(root));
    selectNode(word);
    act(() => result.current.handlePointerUpCapture(pointerEvent(word)));

    act(() => result.current.handlePopoverPointerDown());
    window.getSelection()?.removeAllRanges();
    act(() => document.dispatchEvent(new Event("selectionchange")));
    expect(result.current.selection?.word).toBe("a");

    act(() => result.current.handlePointerDownCapture(pointerEvent(word)));
    act(() => document.dispatchEvent(new Event("selectionchange")));
    expect(result.current.selection).toBeNull();
  });

  it("does not select when dictionary configuration is unavailable", () => {
    const { result } = renderHook(() => useDictionarySelection({ isConfigured: false }));
    act(() => result.current.setRootElement(root));
    selectNode(word);

    act(() => result.current.handlePointerUpCapture(pointerEvent(word)));

    expect(result.current.selection).toBeNull();
  });
});

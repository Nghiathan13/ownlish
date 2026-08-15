import { afterEach, describe, expect, it } from "vitest";
import { getDictionarySelectionInsideRoot } from "./getDictionarySelectionInsideRoot";

function selectNode(node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return range;
}

afterEach(() => {
  window.getSelection()?.removeAllRanges();
  document.body.replaceChildren();
});

describe("getDictionarySelectionInsideRoot", () => {
  it("returns a normalized word and a cloned range for a valid selection in the root", () => {
    const root = document.createElement("div");
    const word = document.createElement("span");
    word.textContent = " A ";
    root.append(word);
    document.body.append(root);
    const range = selectNode(word);

    const result = getDictionarySelectionInsideRoot(root);

    expect(result?.word).toBe("a");
    expect(result?.range).not.toBe(range);
    expect(result?.range.toString()).toBe(" A ");
  });

  it("ignores collapsed, invalid, and outside selections", () => {
    const root = document.createElement("div");
    const invalidWord = document.createElement("span");
    invalidWord.textContent = "a.";
    const outsideWord = document.createElement("span");
    outsideWord.textContent = "a";
    root.append(invalidWord);
    document.body.append(root, outsideWord);

    expect(getDictionarySelectionInsideRoot(root)).toBeNull();

    selectNode(invalidWord);
    expect(getDictionarySelectionInsideRoot(root)).toBeNull();

    selectNode(outsideWord);
    expect(getDictionarySelectionInsideRoot(root)).toBeNull();
  });
});

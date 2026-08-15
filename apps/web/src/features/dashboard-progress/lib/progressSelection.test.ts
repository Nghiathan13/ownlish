import { describe, expect, it } from "vitest";
import { getSelectionMode, isFullSelection } from "./progressSelection";

describe("getSelectionMode", () => {
  it("returns empty when nothing is selected", () => {
    expect(getSelectionMode(0, false)).toBe("empty");
    expect(getSelectionMode(0, true)).toBe("empty");
  });

  it("returns all when every option is selected", () => {
    expect(getSelectionMode(3, true)).toBe("all");
  });

  it("returns single for one selected option", () => {
    expect(getSelectionMode(1, false)).toBe("single");
  });

  it("returns multi for more than one partial selection", () => {
    expect(getSelectionMode(2, false)).toBe("multi");
    expect(getSelectionMode(5, false)).toBe("multi");
  });
});

describe("isFullSelection", () => {
  it("is false when the catalog is empty", () => {
    expect(isFullSelection([], [])).toBe(false);
    expect(isFullSelection(["a"], [])).toBe(false);
  });

  it("is true only when selected matches all ids", () => {
    expect(isFullSelection(["a", "b"], ["a", "b"])).toBe(true);
    expect(isFullSelection(["b", "a"], ["a", "b"])).toBe(true);
  });

  it("is false for partial or extra selections", () => {
    expect(isFullSelection(["a"], ["a", "b"])).toBe(false);
    expect(isFullSelection(["a", "b", "c"], ["a", "b"])).toBe(false);
    expect(isFullSelection(["a", "c"], ["a", "b"])).toBe(false);
  });
});

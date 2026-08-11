import { describe, expect, it } from "vitest";
import {
  addPartToSelection,
  isPartEnabled,
  removePartFromSelection,
} from "./toeicPartPicker";

describe("TOEIC part picker helpers", () => {
  it("enables supported parts only", () => {
    expect(isPartEnabled(1)).toBe(true);
    expect(isPartEnabled(7)).toBe(true);
    expect(isPartEnabled(8)).toBe(false);
  });

  it("adds a missing part without mutating or duplicating selection", () => {
    const current = [1, 3];

    expect(addPartToSelection(current, 2)).toEqual([1, 3, 2]);
    expect(addPartToSelection(current, 3)).toBe(current);
  });

  it("removes every matching part", () => {
    expect(removePartFromSelection([1, 2, 2, 3], 2)).toEqual([1, 3]);
  });
});

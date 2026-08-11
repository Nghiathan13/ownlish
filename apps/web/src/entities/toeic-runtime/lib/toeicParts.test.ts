import { describe, expect, it } from "vitest";
import {
  areAllPartsSelected,
  isToeicPartNumber,
  normalizeSelectedParts,
  parseSelectedPartsParam,
} from "./toeicParts";

describe("TOEIC part selection", () => {
  it("recognizes only the seven TOEIC parts", () => {
    expect(isToeicPartNumber(1)).toBe(true);
    expect(isToeicPartNumber(7)).toBe(true);
    expect(isToeicPartNumber(0)).toBe(false);
    expect(isToeicPartNumber(8)).toBe(false);
  });

  it("uses every part when no selection is supplied", () => {
    expect(normalizeSelectedParts(null)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps valid unique parts in ascending order", () => {
    expect(normalizeSelectedParts([7, 2, 2, 0, 9, 4])).toEqual([2, 4, 7]);
    expect(normalizeSelectedParts([])).toEqual([]);
  });

  it("parses a URL selection and rejects empty or invalid values", () => {
    expect(parseSelectedPartsParam(" 7, 1, 1, 8 ")).toEqual([1, 7]);
    expect(parseSelectedPartsParam("8, 0")).toBeNull();
    expect(parseSelectedPartsParam(" ")).toBeNull();
    expect(parseSelectedPartsParam(undefined)).toBeNull();
  });

  it("checks whether every part is selected", () => {
    expect(areAllPartsSelected([1, 2, 3, 4, 5, 6, 7])).toBe(true);
    expect(areAllPartsSelected([1, 2, 3])).toBe(false);
  });
});

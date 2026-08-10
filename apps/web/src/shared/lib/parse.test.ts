import { describe, expect, it } from "vitest";
import { isBoolean, isNullableString, isNumber, isRecord, isString } from "./parse";

describe("parse guards", () => {
  it("recognizes records but rejects arrays and null", () => {
    expect(isRecord({ value: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });

  it("recognizes strings and nullable strings", () => {
    expect(isString("ownlish")).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isNullableString(null)).toBe(true);
    expect(isNullableString("ownlish")).toBe(true);
    expect(isNullableString(undefined)).toBe(false);
  });

  it("accepts finite numbers and booleans only", () => {
    expect(isNumber(1.5)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean("false")).toBe(false);
  });
});

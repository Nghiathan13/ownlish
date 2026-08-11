import { describe, expect, it } from "vitest";
import {
  getTestsListPath,
  getTestsListPathFromYearValue,
  parseToeicYearParam,
} from "./toeicYears";

describe("toeicYears navigation helpers", () => {
  it("builds canonical mock tests overview paths from year", () => {
    expect(getTestsListPath(2026)).toBe("/tests?tab=mock_tests&year=2026");
    expect(getTestsListPath(2025)).toBe("/tests?tab=mock_tests&year=2025");
  });

  it("parses valid year params", () => {
    expect(parseToeicYearParam("2025")).toBe(2025);
    expect(parseToeicYearParam("2026")).toBe(2026);
  });

  it("rejects invalid year params", () => {
    expect(parseToeicYearParam(null)).toBeNull();
    expect(parseToeicYearParam("")).toBeNull();
    expect(parseToeicYearParam("1999")).toBeNull();
    expect(parseToeicYearParam("abc")).toBeNull();
  });

  it("falls back to the default year for unknown values", () => {
    expect(getTestsListPathFromYearValue(1999)).toBe(
      "/tests?tab=mock_tests&year=2026",
    );
    expect(getTestsListPathFromYearValue(2024)).toBe(
      "/tests?tab=mock_tests&year=2024",
    );
  });
});

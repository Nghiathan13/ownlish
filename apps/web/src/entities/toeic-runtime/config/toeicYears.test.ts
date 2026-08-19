import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  getTestsListPathFromYearValue,
  getToeicYearButtonLabel,
  parseToeicYearParam,
  TOEIC_YEAR_SERIES,
  TOEIC_YEARS,
} from "./toeicYears";

describe("toeicYears navigation helpers", () => {
  it("builds canonical mock tests overview paths from year", () => {
    expect(getTestsListPath(2026)).toBe("/tests/mock-tests?year=2026");
    expect(getTestsListPath(2025)).toBe("/tests/mock-tests?year=2025");
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
      "/tests/mock-tests?year=2026",
    );
    expect(getTestsListPathFromYearValue(2024)).toBe(
      "/tests/mock-tests?year=2024",
    );
  });

  it("keeps the year list, default, and labels in one series", () => {
    expect(DEFAULT_TOEIC_YEAR).toBe(TOEIC_YEAR_SERIES[0].year);
    expect(TOEIC_YEARS).toEqual(TOEIC_YEAR_SERIES.map((item) => item.year));
    expect(getToeicYearButtonLabel(2026)).toBe("ETS 2026");
    expect(getToeicYearButtonLabel(2025)).toBe("YBM 2025");
  });
});


import { describe, expect, it } from "vitest";
import type { ToeicCatalogTest } from "@/entities/toeic-catalog";
import {
  formatCatalogTestLabel,
  materializeCatalogTestSummary,
} from "./catalogTestSummary";

const catalog: ToeicCatalogTest = {
  id: "ets-2023-1",
  series: "ETS Official",
  year: 2023,
  testNumber: 2,
  complete: true,
  parts: [
    { number: 1, path: "p1", questionCount: 6 },
    { number: 2, path: "p2", questionCount: 25 },
  ],
};

describe("catalogTestSummary", () => {
  it("formats a provider year and test number", () => {
    expect(
      formatCatalogTestLabel({
        catalog,
        totalQuestions: 31,
        parts: [],
      }),
    ).toBe("ETS 2023 · Test 2");
  });

  it("falls back to TOEIC when the series has no letters", () => {
    expect(
      formatCatalogTestLabel({
        catalog: { ...catalog, series: "2023" },
        totalQuestions: 31,
        parts: [],
      }),
    ).toBe("TOEIC 2023 · Test 2");
  });

  it("joins catalog parts with optional practice progress", () => {
    expect(
      materializeCatalogTestSummary(catalog, {
        testKey: catalog.id,
        answeredCount: 4,
        correctCount: 3,
        wrongCount: 1,
        parts: [{ partNumber: 1, correctCount: 3, wrongCount: 1 }],
      }),
    ).toEqual({
      catalog,
      totalQuestions: 31,
      parts: [
        { partNumber: 1, partCorrectCount: 3, partWrongCount: 1 },
        { partNumber: 2, partCorrectCount: 0, partWrongCount: 0 },
      ],
    });
  });
});

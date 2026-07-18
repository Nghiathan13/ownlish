import { describe, expect, it } from "vitest";
import {
  getPartPracticeRunApiPath,
  getPartPracticeRunPath,
  getTestsOverviewPath,
  getTestsOverviewRedirectTarget,
  isPartPracticeRunPath,
  parsePartPracticeRunPartParam,
  parsePartPracticeRunMode,
  parsePracticeOverviewPartParam,
  parseTestsOverviewTab,
} from "./partPracticePaths";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

describe("partPracticePaths", () => {
  it("builds aggregate run paths with mode query param", () => {
    expect(getPartPracticeRunPath(SESSION_ID, "practice")).toBe(
      `/tests/part-practice/${SESSION_ID}?mode=practice`,
    );
    expect(getPartPracticeRunPath(SESSION_ID, "review_wrong")).toBe(
      `/tests/part-practice/${SESSION_ID}?mode=review_wrong`,
    );
    expect(getPartPracticeRunPath(SESSION_ID, "practice", 3)).toBe(
      `/tests/part-practice/${SESSION_ID}?mode=practice&part=3`,
    );
  });

  it("builds aggregate API paths", () => {
    expect(getPartPracticeRunApiPath(SESSION_ID)).toBe(
      `/tests/part-practice/runs/${SESSION_ID}`,
    );
    expect(
      getPartPracticeRunApiPath(SESSION_ID, { mode: "review_wrong" }),
    ).toBe(`/tests/part-practice/runs/${SESSION_ID}?mode=review_wrong`);
  });

  it("builds canonical tests overview paths", () => {
    expect(getTestsOverviewPath()).toBe("/tests?tab=mock_tests&year=2026");
    expect(getTestsOverviewPath({ tab: "part_practice" })).toBe(
      "/tests?tab=part_practice",
    );
    expect(getTestsOverviewPath({ tab: "part_practice", part: 4 })).toBe(
      "/tests?tab=part_practice&part=4",
    );
    expect(getTestsOverviewPath({ year: 2024, tab: "part_practice" })).toBe(
      "/tests?tab=part_practice",
    );
    expect(getTestsOverviewPath({ year: 2024, tab: "mock_tests" })).toBe(
      "/tests?tab=mock_tests&year=2024",
    );
  });

  it("parses practice overview part param", () => {
    expect(parsePracticeOverviewPartParam("4")).toBe(4);
    expect(parsePracticeOverviewPartParam("0")).toBeNull();
    expect(parsePracticeOverviewPartParam("abc")).toBeNull();
    expect(parsePartPracticeRunPartParam("3")).toBe(3);
  });

  it("normalizes overview URLs to canonical tab params", () => {
    expect(getTestsOverviewRedirectTarget(new URLSearchParams())).toBe(
      "/tests?tab=mock_tests&year=2026",
    );
    expect(
      getTestsOverviewRedirectTarget(new URLSearchParams("tab=practice&part=4")),
    ).toBe("/tests?tab=part_practice&part=4");
    expect(
      getTestsOverviewRedirectTarget(
        new URLSearchParams("tab=part_practice&part=4"),
      ),
    ).toBeNull();
    expect(
      getTestsOverviewRedirectTarget(
        new URLSearchParams("tab=mock_tests&year=2024"),
      ),
    ).toBeNull();
    expect(
      getTestsOverviewRedirectTarget(new URLSearchParams("tab=mock&year=2024")),
    ).toBe("/tests?tab=mock_tests&year=2024");
    expect(getTestsOverviewRedirectTarget(new URLSearchParams("year=2024"))).toBe(
      "/tests?tab=mock_tests&year=2024",
    );
    expect(
      getTestsOverviewRedirectTarget(
        new URLSearchParams("tab=practice&year=2024"),
      ),
    ).toBe("/tests?tab=part_practice");
    expect(getTestsOverviewRedirectTarget(new URLSearchParams("year=abc"))).toBe(
      "/tests?tab=mock_tests&year=2026",
    );
  });

  it("parses overview tab and run mode with legacy aliases", () => {
    expect(parseTestsOverviewTab("part_practice")).toBe("part_practice");
    expect(parseTestsOverviewTab("practice")).toBe("part_practice");
    expect(parseTestsOverviewTab("mock_tests")).toBe("mock_tests");
    expect(parseTestsOverviewTab("mock")).toBe("mock_tests");
    expect(parseTestsOverviewTab(null)).toBe("mock_tests");
    expect(parsePartPracticeRunMode("review_wrong")).toBe("review_wrong");
    expect(parsePartPracticeRunMode("practice")).toBe("practice");
  });

  it("detects aggregate run paths", () => {
    expect(isPartPracticeRunPath(`/tests/part-practice/${SESSION_ID}`)).toBe(
      true,
    );
    expect(
      isPartPracticeRunPath(
        `/tests/${SESSION_ID}/practice?parts=1`,
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  getPartPracticeRunApiPath,
  getPartPracticeRunPath,
  getTestsOverviewPath,
  getTestsOverviewRedirectTarget,
  isPartPracticeRunPath,
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
  });

  it("builds aggregate API paths", () => {
    expect(getPartPracticeRunApiPath(SESSION_ID)).toBe(
      `/tests/part-practice/runs/${SESSION_ID}`,
    );
    expect(
      getPartPracticeRunApiPath(SESSION_ID, { mode: "review_wrong" }),
    ).toBe(`/tests/part-practice/runs/${SESSION_ID}?mode=review_wrong`);
  });

  it("builds tests overview paths with optional tab and part", () => {
    expect(getTestsOverviewPath()).toBe("/tests");
    expect(getTestsOverviewPath({ tab: "practice" })).toBe("/tests?tab=practice");
    expect(getTestsOverviewPath({ tab: "practice", part: 4 })).toBe(
      "/tests?tab=practice&part=4",
    );
    expect(getTestsOverviewPath({ year: 2024, tab: "practice" })).toBe(
      "/tests?year=2024&tab=practice",
    );
    expect(getTestsOverviewPath({ year: 2024, tab: "mock" })).toBe(
      "/tests?year=2024",
    );
  });

  it("parses practice overview part param", () => {
    expect(parsePracticeOverviewPartParam("4")).toBe(4);
    expect(parsePracticeOverviewPartParam("0")).toBeNull();
    expect(parsePracticeOverviewPartParam("abc")).toBeNull();
  });

  it("only normalizes year for mock tab overview URLs", () => {
    expect(
      getTestsOverviewRedirectTarget(new URLSearchParams("tab=practice")),
    ).toBeNull();
    expect(
      getTestsOverviewRedirectTarget(new URLSearchParams("tab=practice&year=2024")),
    ).toBeNull();
    expect(getTestsOverviewRedirectTarget(new URLSearchParams())).toBe(
      "/tests?year=2026",
    );
    expect(getTestsOverviewRedirectTarget(new URLSearchParams("year=2024"))).toBeNull();
    expect(getTestsOverviewRedirectTarget(new URLSearchParams("year=abc"))).toBe(
      "/tests?year=2026",
    );
  });

  it("parses overview tab and run mode", () => {
    expect(parseTestsOverviewTab("practice")).toBe("practice");
    expect(parseTestsOverviewTab("mock")).toBe("mock");
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

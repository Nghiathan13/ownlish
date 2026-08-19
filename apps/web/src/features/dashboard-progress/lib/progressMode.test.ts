import { describe, expect, it } from "vitest";
import {
  DEFAULT_DASHBOARD_PROGRESS_MODE,
  getDashboardProgressPath,
  parseDashboardProgressMode,
} from "./progressMode";

describe("progressMode", () => {
  it("builds canonical progress URLs from mode", () => {
    expect(getDashboardProgressPath()).toBe("/dashboard/progress?mode=review");
    expect(getDashboardProgressPath("practice")).toBe(
      "/dashboard/progress?mode=practice",
    );
  });

  it("parses valid mode params", () => {
    expect(parseDashboardProgressMode("review")).toBe("review");
    expect(parseDashboardProgressMode("part_practice")).toBe("part_practice");
  });

  it("rejects invalid mode params", () => {
    expect(parseDashboardProgressMode(null)).toBeNull();
    expect(parseDashboardProgressMode("all")).toBeNull();
    expect(parseDashboardProgressMode("unknown")).toBeNull();
  });

  it("defaults to the first configured mode", () => {
    expect(DEFAULT_DASHBOARD_PROGRESS_MODE).toBe("review");
  });
});

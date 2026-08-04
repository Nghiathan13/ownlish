import { describe, expect, it } from "vitest";
import {
  DASHBOARD_MY_ACTIVITY_PATH,
  DASHBOARD_PROGRESS_PATH,
  getDashboardSectionPath,
  parseDashboardSection,
} from "./dashboardPaths";

describe("dashboardPaths", () => {
  it("maps sections to dashboard routes", () => {
    expect(getDashboardSectionPath("activity")).toBe(DASHBOARD_MY_ACTIVITY_PATH);
    expect(getDashboardSectionPath("progress")).toBe(DASHBOARD_PROGRESS_PATH);
  });

  it("parses dashboard section from pathname", () => {
    expect(parseDashboardSection("/dashboard/my-activity")).toBe("activity");
    expect(parseDashboardSection("/dashboard/progress")).toBe("progress");
    expect(parseDashboardSection("/dashboard")).toBeNull();
    expect(parseDashboardSection("/")).toBeNull();
  });
});

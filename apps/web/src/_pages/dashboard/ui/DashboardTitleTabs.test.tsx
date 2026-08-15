import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { DashboardTitleTabs } from "./DashboardTitleTabs";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

function renderTabs() {
  return render(
    <LocaleProvider>
      <DashboardTitleTabs />
    </LocaleProvider>,
  );
}

describe("DashboardTitleTabs", () => {
  beforeEach(() => {
    mocks.usePathname.mockReset();
  });

  it("marks Progress active on the progress route", () => {
    mocks.usePathname.mockReturnValue("/dashboard/progress");
    renderTabs();

    expect(screen.getByRole("tab", { name: "Progress" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "My activity" })).toHaveAttribute(
      "href",
      "/dashboard/my-activity",
    );
  });

  it("defaults to activity when the path is not a dashboard section", () => {
    mocks.usePathname.mockReturnValue("/dashboard");
    renderTabs();

    expect(screen.getByRole("tab", { name: "My activity" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

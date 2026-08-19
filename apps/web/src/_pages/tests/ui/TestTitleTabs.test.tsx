import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { TestTitleTabs } from "./TestTitleTabs";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

function renderTabs() {
  return render(
    <LocaleProvider>
      <TestTitleTabs />
    </LocaleProvider>,
  );
}

describe("TestTitleTabs", () => {
  beforeEach(() => {
    mocks.usePathname.mockReset();
  });

  it("marks Mock Tests active on its static route", () => {
    mocks.usePathname.mockReturnValue("/tests/mock-tests");
    renderTabs();

    expect(screen.getByRole("tab", { name: "Mock Tests" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Mock Tests" })).toHaveAttribute(
      "href",
      "/tests/mock-tests?year=2026",
    );
    expect(screen.getByRole("tab", { name: "Part Practice" })).toHaveAttribute(
      "href",
      "/tests/part-practice?part=1",
    );
  });

  it("marks Part Practice active on its static route", () => {
    mocks.usePathname.mockReturnValue("/tests/part-practice");
    renderTabs();

    expect(screen.getByRole("tab", { name: "Part Practice" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Mock Tests" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

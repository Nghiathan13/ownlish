import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { TestsOverviewTabs } from "./TestsOverviewTabs";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("@/shared/ui/page-header", () => ({
  PageHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PageHeaderTabs: ({ activeKey }: { activeKey: string }) => (
    <div data-testid="tests-overview-tabs">{activeKey}</div>
  ),
}));

describe("TestsOverviewTabs", () => {
  beforeEach(() => {
    mocks.usePathname.mockReset();
  });

  it("keeps Mock Tests active on its static route", () => {
    mocks.usePathname.mockReturnValue("/tests/mock-tests");

    render(
      <LocaleProvider>
        <TestsOverviewTabs />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("tests-overview-tabs")).toHaveTextContent(
      "mock_tests",
    );
  });

  it("keeps Part Practice active on its static route", () => {
    mocks.usePathname.mockReturnValue("/tests/part-practice");

    render(
      <LocaleProvider>
        <TestsOverviewTabs />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("tests-overview-tabs")).toHaveTextContent(
      "part_practice",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { MockTestsPage } from "./MockTestsPage";

const mocks = vi.hoisted(() => ({
  mockTestsTab: vi.fn(() => <div data-testid="mock-tests-tab" />),
  useAuthSession: vi.fn(),
  useToeicCatalogQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/tests/mock-tests",
}));

vi.mock("@/entities/session", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/entities/toeic-catalog", () => ({
  useToeicCatalogQuery: mocks.useToeicCatalogQuery,
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./overview/components/MockTestsTab", () => ({
  MockTestsTab: mocks.mockTestsTab,
}));

vi.mock("./overview/components/TestsOverviewTabs", () => ({
  TestsOverviewTabs: () => <div data-testid="tests-overview-tabs" />,
}));

vi.mock("@/shared/ui/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("MockTestsPage", () => {
  beforeEach(() => {
    mocks.mockTestsTab.mockClear();
    mocks.useAuthSession.mockReturnValue({ status: "authenticated" });
    mocks.useToeicCatalogQuery.mockReturnValue({
      data: {
        rootUrl: "https://example.com/toeic",
        manifest: {
          generatedAt: "2026-07-22T00:00:00.000Z",
          mediaByGroupId: {},
          partPractice: [],
          schemaVersion: 1,
          tests: [
            {
              complete: false,
              id: "ets23-t01",
              parts: [
                {
                  firstGroupKey: "ets23-t01-p1-g001",
                  number: 1,
                  path: "ets_23/test_01/part_1.json",
                  questionCount: 6,
                },
              ],
              series: "ets_23",
              testNumber: 1,
              year: 2023,
            },
          ],
        },
      },
      error: null,
      isLoading: false,
    });
  });

  it("renders mock tests immediately with the requested year", () => {
    render(
      <LocaleProvider>
        <MockTestsPage year={2023} />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("tests-overview-tabs")).toBeInTheDocument();

    const props = mocks.mockTestsTab.mock.calls.at(-1)?.[0];

    expect(props.selectedYear).toBe(2023);
    expect(props.source?.manifest.tests[0]?.year).toBe(2023);
  });

  it("does not wait for the catalog before showing mock tests", () => {
    mocks.useToeicCatalogQuery.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });

    render(
      <LocaleProvider>
        <MockTestsPage year={2025} />
      </LocaleProvider>,
    );

    const props = mocks.mockTestsTab.mock.calls.at(-1)?.[0];

    expect(props.selectedYear).toBe(2025);
    expect(props.source).toBeUndefined();
    expect(props.catalogError).toBeNull();
  });
});

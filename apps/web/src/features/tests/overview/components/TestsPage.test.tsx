import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestsPage } from "./TestsPage";

const mocks = vi.hoisted(() => ({
  mockTestsTab: vi.fn(() => <div data-testid="mock-tests-tab" />),
  replace: vi.fn(),
  useAuthSession: vi.fn(),
  useSearchParams: vi.fn(),
  useToeicCatalogQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: mocks.useSearchParams,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/entities/toeic-catalog/model/useToeicCatalogQuery", () => ({
  useToeicCatalogQuery: mocks.useToeicCatalogQuery,
}));

vi.mock("./MockTestsTab", () => ({
  MockTestsTab: mocks.mockTestsTab,
}));

describe("TestsPage", () => {
  beforeEach(() => {
    mocks.mockTestsTab.mockClear();
    mocks.replace.mockClear();
    mocks.useAuthSession.mockReturnValue({ status: "authenticated" });
    mocks.useSearchParams.mockReturnValue(
      new URLSearchParams("tab=mock_tests&year=2023"),
    );
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

  it("keeps incomplete catalog years available for testing", () => {
    render(<TestsPage />);

    const props = mocks.mockTestsTab.mock.calls.at(-1)?.[0];

    expect(props.availableYears).toEqual([2023]);
    expect(props.selectedYear).toBe(2023);
  });
});

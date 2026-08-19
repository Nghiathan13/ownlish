import { act, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { MockSessionRoutePage } from "./MockSessionRoutePage";

const mocks = vi.hoisted(() => ({
  mockRunView: vi.fn(() => <div data-testid="mock-run-view" />),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: mocks.useSearchParams,
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/test-study", () => ({
  MockRunView: mocks.mockRunView,
  TestRunLoadingSkeleton: () => <div data-testid="run-loading" />,
}));

vi.mock("@/features/dictionary-lookup", () => ({
  DictionaryLookupBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dictionary-lookup-boundary">{children}</div>
  ),
}));

const sessionId = "123e4567-e89b-42d3-a456-426614174000";

describe("MockSessionRoutePage", () => {
  beforeEach(() => {
    mocks.mockRunView.mockClear();
    mocks.useSearchParams.mockReturnValue(
      new URLSearchParams("parts=1,2&test=ets-1"),
    );
  });

  it("wraps the mock-test surface in the dictionary boundary", async () => {
    const params = Promise.resolve({ sessionId });

    await act(async () => {
      render(
        <LocaleProvider>
          <Suspense fallback={<div data-testid="page-loading" />}>
            <MockSessionRoutePage params={params} />
          </Suspense>
        </LocaleProvider>,
      );
      await params;
    });

    const boundary = await screen.findByTestId("dictionary-lookup-boundary");
    expect(within(boundary).getByTestId("mock-run-view")).toBeInTheDocument();
    expect(mocks.mockRunView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedParts: [1, 2],
        sessionId,
        testKey: "ets-1",
      }),
      undefined,
    );
  });
});

import { act, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { PartPracticeSessionRoutePage } from "./PartPracticeSessionRoutePage";

const mocks = vi.hoisted(() => ({
  partPracticeRunView: vi.fn(() => <div data-testid="part-practice-run-view" />),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: mocks.useSearchParams,
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/test-study", () => ({
  PartPracticeRunView: mocks.partPracticeRunView,
  TestRunLoadingSkeleton: () => <div data-testid="run-loading" />,
}));

vi.mock("@/features/dictionary-lookup", () => ({
  DictionaryLookupBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dictionary-lookup-boundary">{children}</div>
  ),
}));

const sessionId = "123e4567-e89b-42d3-a456-426614174000";

describe("PartPracticeSessionRoutePage", () => {
  beforeEach(() => {
    mocks.partPracticeRunView.mockClear();
    mocks.useSearchParams.mockReturnValue(new URLSearchParams("mode=review_wrong&part=3"));
  });

  it("wraps the part-practice test surface in the dictionary boundary", async () => {
    const params = Promise.resolve({ sessionId });

    await act(async () => {
      render(
        <LocaleProvider>
          <Suspense fallback={<div data-testid="page-loading" />}>
            <PartPracticeSessionRoutePage params={params} />
          </Suspense>
        </LocaleProvider>,
      );
      await params;
    });

    const boundary = await screen.findByTestId("dictionary-lookup-boundary");
    expect(within(boundary).getByTestId("part-practice-run-view")).toBeInTheDocument();
    expect(mocks.partPracticeRunView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        partNumber: 3,
        practiceMode: "review_wrong",
        sessionId,
      }),
      undefined,
    );
  });
});

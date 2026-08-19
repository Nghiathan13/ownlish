import { act, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { PracticeSessionRoutePage } from "./PracticeSessionRoutePage";

const mocks = vi.hoisted(() => ({
  practiceRunView: vi.fn(() => <div data-testid="practice-run-view" />),
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
  PracticeRunView: mocks.practiceRunView,
  TestRunLoadingSkeleton: () => <div data-testid="run-loading" />,
}));

vi.mock("@/features/dictionary-lookup", () => ({
  DictionaryLookupBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dictionary-lookup-boundary">{children}</div>
  ),
}));

const sessionId = "123e4567-e89b-42d3-a456-426614174000";

async function renderRoute(mode: "practice" | "review_wrong") {
  const params = Promise.resolve({ sessionId });

  await act(async () => {
    render(
      <LocaleProvider>
        <Suspense fallback={<div data-testid="page-loading" />}>
          <PracticeSessionRoutePage mode={mode} params={params} />
        </Suspense>
      </LocaleProvider>,
    );
    await params;
  });
}

describe("PracticeSessionRoutePage", () => {
  beforeEach(() => {
    mocks.practiceRunView.mockClear();
    mocks.useSearchParams.mockReturnValue(
      new URLSearchParams("parts=1,2&test=ets-1"),
    );
  });

  it.each(["practice", "review_wrong"] as const)(
    "wraps the %s test surface in the dictionary boundary",
    async (mode) => {
      await renderRoute(mode);

      const boundary = await screen.findByTestId("dictionary-lookup-boundary");
      expect(within(boundary).getByTestId("practice-run-view")).toBeInTheDocument();
      expect(mocks.practiceRunView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          practiceMode: mode,
          selectedParts: [1, 2],
          sessionId,
          testKey: "ets-1",
        }),
        undefined,
      );
    },
  );
});

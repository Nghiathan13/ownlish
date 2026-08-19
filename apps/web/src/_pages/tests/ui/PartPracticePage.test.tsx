import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { PartPracticePage } from "./PartPracticePage";

const mocks = vi.hoisted(() => ({
  partPracticeCard: vi.fn(() => <div data-testid="part-practice-card" />),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/tests/part-practice",
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/test-overview", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/test-overview")>()),
  PartPracticeCard: mocks.partPracticeCard,
}));

describe("PartPracticePage", () => {
  it("renders part tabs and cards inside the shared card frame", () => {
    render(
      <LocaleProvider>
        <PartPracticePage partNumber={3} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Part Practice" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Part 3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("part-practice-card").parentElement).toHaveClass(
      "grid",
      "gap-4",
    );
    expect(mocks.partPracticeCard).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedPartNumber: 3,
      }),
      undefined,
    );
  });
});

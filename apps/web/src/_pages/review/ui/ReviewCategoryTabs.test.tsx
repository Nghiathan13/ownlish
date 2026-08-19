import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ReviewCategoryTabs } from "./ReviewCategoryTabs";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

describe("ReviewCategoryTabs", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/review");
  });

  it("marks My Collections active on /review", () => {
    render(
      <LocaleProvider>
        <ReviewCategoryTabs />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "My Collections" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Oxford" })).toHaveAttribute(
      "href",
      "/review/oxford?band=A1&group=1",
    );
  });

  it("marks Oxford active on the Oxford review route", () => {
    mocks.usePathname.mockReturnValue("/review/oxford");

    render(
      <LocaleProvider>
        <ReviewCategoryTabs />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Oxford" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "My Collections" })).toHaveAttribute(
      "href",
      "/review",
    );
  });
});

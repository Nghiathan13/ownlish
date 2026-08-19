import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ReviewCategoryTabs } from "./ReviewCategoryTabs";

describe("ReviewCategoryTabs", () => {
  it("marks Oxford active and reports category changes", () => {
    const onCategoryChange = vi.fn();

    render(
      <LocaleProvider>
        <ReviewCategoryTabs
          activeCategory="oxford"
          onCategoryChange={onCategoryChange}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Oxford" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("tab", { name: "My Collections" }));
    expect(onCategoryChange).toHaveBeenCalledWith("user");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { DictationCategoryTabs } from "./DictationCategoryTabs";

describe("DictationCategoryTabs", () => {
  it("marks the active category and links each configured tab", () => {
    render(
      <LocaleProvider>
        <DictationCategoryTabs activeCategoryId="bbc" />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "BBC" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Music" })).toHaveAttribute(
      "href",
      "/dictation/music",
    );
    expect(screen.getByRole("tab", { name: "BBC" })).toHaveAttribute(
      "href",
      "/dictation/bbc",
    );
  });
});

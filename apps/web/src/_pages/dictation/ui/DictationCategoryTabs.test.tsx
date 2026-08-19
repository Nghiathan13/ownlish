import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { DictationCategoryTabs } from "./DictationCategoryTabs";

const categories = [
  { id: "bbc", label: "BBC", path: "catalogs/bbc.json" },
  { id: "music", label: "Music", path: "catalogs/music.json" },
];

function renderTabs(activeCategoryId: string) {
  return render(
    <LocaleProvider>
      <DictationCategoryTabs
        activeCategoryId={activeCategoryId}
        categories={categories}
      />
    </LocaleProvider>,
  );
}

describe("DictationCategoryTabs", () => {
  it("marks the active category and links each tab to its library route", () => {
    renderTabs("bbc");

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

  it("renders nothing when the index has no categories", () => {
    const { container } = render(
      <LocaleProvider>
        <DictationCategoryTabs activeCategoryId="bbc" categories={[]} />
      </LocaleProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

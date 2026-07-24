import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { CollectionCategorySelect } from "./CollectionCategorySelect";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

describe("CollectionCategorySelect", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("opens the selected category", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");

    render(
      <LocaleProvider>
        <CollectionCategorySelect activeCategory="user" />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Collection category: My Collections",
      }),
    );
    await user.click(screen.getByRole("option", { name: "Oxford" }));

    expect(pushState).toHaveBeenCalledWith(null, "", "/collections/oxford/A1");
    expect(mocks.push).toHaveBeenCalledWith("/collections/oxford/A1", {
      scroll: false,
    });
    expect(pushState.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.push.mock.invocationCallOrder[0],
    );
  });

  it("delegates navigation to the parent when provided", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();

    render(
      <LocaleProvider>
        <CollectionCategorySelect
          activeCategory="user"
          onCategoryChange={onCategoryChange}
        />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Collection category: My Collections",
      }),
    );
    await user.click(screen.getByRole("option", { name: "Oxford" }));

    expect(onCategoryChange).toHaveBeenCalledWith("oxford");
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

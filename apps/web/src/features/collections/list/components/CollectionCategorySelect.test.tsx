import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

    render(<CollectionCategorySelect activeCategory="user" />);

    await user.click(
      screen.getByRole("button", {
        name: "Collection category: My Collections",
      }),
    );
    await user.click(screen.getByRole("option", { name: "Oxford" }));

    expect(pushState).toHaveBeenCalledWith(null, "", "/collections/oxford/A1");
    expect(mocks.push).toHaveBeenCalledWith("/collections/oxford/A1");
    expect(pushState.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.push.mock.invocationCallOrder[0],
    );
  });
});

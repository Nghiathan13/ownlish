import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CollectionCategorySelect } from "./CollectionCategorySelect";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

describe("CollectionCategorySelect", () => {
  it("opens the selected category", async () => {
    const user = userEvent.setup();

    render(<CollectionCategorySelect activeCategory="user" />);

    await user.click(
      screen.getByRole("button", {
        name: "Collection category: My Collections",
      }),
    );
    await user.click(screen.getByRole("option", { name: "Oxford" }));

    expect(mocks.push).toHaveBeenCalledWith("/collections/oxford/A1");
  });
});

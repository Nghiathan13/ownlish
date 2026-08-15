import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ProgressSourceMenu } from "./ProgressSourceMenu";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderMenu(
  props: Partial<React.ComponentProps<typeof ProgressSourceMenu>> = {},
) {
  const onSourceChange = vi.fn();
  render(
    <LocaleProvider>
      <ProgressSourceMenu
        onSourceChange={onSourceChange}
        source="collection"
        {...props}
      />
    </LocaleProvider>,
  );
  return { onSourceChange };
}

describe("ProgressSourceMenu", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("shows the current source title", () => {
    renderMenu({ source: "collection" });
    expect(screen.getByText("My Collection")).toBeInTheDocument();
  });

  it("toggles the menu on click when hover is unavailable", async () => {
    const user = userEvent.setup();
    const { onSourceChange } = renderMenu();

    const trigger = screen.getByRole("button", {
      name: "Switch progress source",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitemradio", { name: "Oxford" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitemradio", { name: "Oxford" }));
    expect(onSourceChange).toHaveBeenCalledWith("oxford");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and outside click", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", {
      name: "Switch progress source",
    });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("ignores click toggling when hover-capable", () => {
    mockMatchMedia(true);
    renderMenu();

    const trigger = screen.getByRole("button", {
      name: "Switch progress source",
    });
    // fireEvent.click does not synthesize hover; onClick is a no-op when hover-capable.
    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on hover when hover-capable", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    renderMenu({ source: "oxford" });

    expect(screen.getByText("Oxford")).toBeInTheDocument();
    const trigger = screen.getByRole("button", {
      name: "Switch progress source",
    });

    await user.hover(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "My Collection" }),
    ).toBeInTheDocument();
  });
});

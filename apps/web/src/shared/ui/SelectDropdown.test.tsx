import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectDropdown } from "./SelectDropdown";

const options = [
  { label: "First", value: "first" },
  { label: "Second", value: "second" },
] as const;

describe("SelectDropdown", () => {
  it("opens, selects an option and closes the menu", () => {
    const onChange = vi.fn();
    render(
      <SelectDropdown
        ariaLabel="Choose item"
        className="w-48"
        onChange={onChange}
        options={[...options]}
        value="first"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Choose item: First" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox", { name: "Choose item" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Second" }));
    expect(onChange).toHaveBeenCalledWith("second");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape and outside click", () => {
    render(
      <SelectDropdown
        ariaLabel="Choose item"
        className="w-48"
        onChange={vi.fn()}
        options={[...options]}
        value="first"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Choose item: First" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports horizontal, top-aligned menus without a trigger icon", () => {
    render(
      <SelectDropdown
        ariaLabel="Choose item"
        className="w-48"
        hideIcon
        menuAlign="left"
        menuOrientation="horizontal"
        menuPlacement="top"
        onChange={vi.fn()}
        options={[...options]}
        value="missing"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Choose item: Select option",
    });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toHaveClass("left-0", "bottom-[calc(100%+0.5rem)]");
    expect(trigger.querySelector("svg")).toBeNull();
  });
});

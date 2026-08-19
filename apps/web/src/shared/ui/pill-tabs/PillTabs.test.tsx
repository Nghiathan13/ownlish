import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PillTabs } from "./PillTabs";

const items = [
  { href: "/first", key: "first", label: "First" },
  { href: "/second", key: "second", label: "Second" },
] as const;

describe("PillTabs", () => {
  it("renders link tabs and marks the active item", () => {
    render(
      <PillTabs
        activeKey="first"
        ariaLabel="Filters"
        items={[...items]}
      />,
    );

    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute(
      "href",
      "/second",
    );
  });

  it("uses buttons when the page owns tab navigation", () => {
    const onTabChange = vi.fn();

    render(
      <PillTabs
        activeKey="first"
        ariaLabel="Filters"
        items={[...items]}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(onTabChange).toHaveBeenCalledWith("second");
  });
});

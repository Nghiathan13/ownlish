import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarThemeToggle } from "./SidebarThemeToggle";

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
  useResolvedTheme: vi.fn(),
}));

vi.mock("@/shared/providers/ThemeProvider", () => ({
  useTheme: () => ({ setTheme: mocks.setTheme, theme: "system" }),
  useResolvedTheme: mocks.useResolvedTheme,
}));

describe("SidebarThemeToggle", () => {
  beforeEach(() => {
    mocks.setTheme.mockReset();
    mocks.useResolvedTheme.mockReturnValue("light");
  });

  it("shows the dark mode action and switches to dark", () => {
    render(<SidebarThemeToggle collapsed={false} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
  });

  it("shows the light mode tooltip when collapsed", () => {
    mocks.useResolvedTheme.mockReturnValue("dark");

    render(<SidebarThemeToggle collapsed />);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Switch to light theme")).toBeInTheDocument();
    expect(screen.queryByText("Light mode")).not.toBeInTheDocument();
  });
});

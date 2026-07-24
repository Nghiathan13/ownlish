import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { SidebarThemeToggle } from "./SidebarThemeToggle";

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
  useResolvedTheme: vi.fn(),
}));

vi.mock("@/shared/providers/ThemeProvider", () => ({
  useTheme: () => ({ setTheme: mocks.setTheme, theme: "system" }),
  useResolvedTheme: mocks.useResolvedTheme,
}));

function renderToggle(collapsed: boolean) {
  return render(
    <LocaleProvider>
      <SidebarThemeToggle collapsed={collapsed} />
    </LocaleProvider>,
  );
}

describe("SidebarThemeToggle", () => {
  beforeEach(() => {
    mocks.setTheme.mockReset();
    mocks.useResolvedTheme.mockReturnValue("light");
  });

  it("shows the dark mode action and switches to dark", () => {
    renderToggle(false);

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
  });

  it("shows the light mode tooltip when collapsed", () => {
    mocks.useResolvedTheme.mockReturnValue("dark");

    renderToggle(true);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Switch to light theme")).toBeInTheDocument();
    expect(screen.queryByText("Light mode")).not.toBeInTheDocument();
  });
});

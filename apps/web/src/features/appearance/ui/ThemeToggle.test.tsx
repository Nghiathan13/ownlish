import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ThemeToggle } from "./ThemeToggle";

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
  useResolvedTheme: vi.fn(),
}));

vi.mock("@/shared/lib/providers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib/providers")>()),
  useTheme: () => ({ setTheme: mocks.setTheme, theme: "system" }),
  useResolvedTheme: mocks.useResolvedTheme,
}));

function renderSidebarToggle(collapsed: boolean) {
  return render(
    <LocaleProvider>
      <ThemeToggle collapsed={collapsed} variant="sidebar" />
    </LocaleProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    mocks.setTheme.mockReset();
    mocks.useResolvedTheme.mockReturnValue("light");
  });

  it("shows the dark mode action and switches to dark", () => {
    renderSidebarToggle(false);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Dark mode: Switch to dark theme",
      }),
    );

    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
  });

  it("shows the light mode tooltip when collapsed", () => {
    mocks.useResolvedTheme.mockReturnValue("dark");

    renderSidebarToggle(true);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Switch to light theme")).toBeInTheDocument();
    expect(screen.queryByText("Light mode")).not.toBeInTheDocument();
  });

  it("switches theme from the compact control", () => {
    render(
      <LocaleProvider>
        <ThemeToggle variant="compact" />
      </LocaleProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(screen.queryByText("Dark mode")).not.toBeInTheDocument();
  });
});

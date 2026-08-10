import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileTopNav } from "./MobileTopNav";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  replace: vi.fn(),
  setLocale: vi.fn(),
  setTheme: vi.fn(),
  useAuthSession: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/features/auth/hooks/useAuthSession", () => ({ useAuthSession: mocks.useAuthSession }));
vi.mock("@/shared/providers/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en", setLocale: mocks.setLocale, t: (key: string) => key }),
  useT: () => (key: string) => key,
}));
vi.mock("@/shared/providers/ThemeProvider", () => ({
  useResolvedTheme: () => "light",
  useTheme: () => ({ setTheme: mocks.setTheme }),
}));
vi.mock("./SidebarUserMenu", () => ({
  SidebarUserMenu: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>Logout</button>,
}));

describe("MobileTopNav", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/review");
    mocks.useAuthSession.mockReturnValue({
      logout: mocks.logout,
      updateProfile: vi.fn(),
      user: { id: "user" },
    });
    mocks.replace.mockReset();
    mocks.logout.mockReset();
  });

  it("opens and closes the menu, locking and restoring the shell scroll area", () => {
    render(<><div data-mobile-shell-scroll /><MobileTopNav /></>);
    fireEvent.click(screen.getByRole("button", { name: "shell.openMenu" }));

    expect(screen.getByRole("dialog", { name: "shell.openMenu" })).toBeInTheDocument();
    expect(document.querySelector<HTMLElement>("[data-mobile-shell-scroll]")?.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector<HTMLElement>("[data-mobile-shell-scroll]")?.style.overflow).toBe("");
  });

  it("updates locale and theme, and sends logout users to login", () => {
    render(<MobileTopNav />);
    fireEvent.click(screen.getByRole("button", { name: "locale.switchToVi" }));
    fireEvent.click(screen.getByRole("button", { name: "theme.switchToDark" }));
    fireEvent.click(screen.getByRole("button", { name: "shell.openMenu" }));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(mocks.setLocale).toHaveBeenCalledWith("vi");
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("@/entities/session", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  isLoadingStatus: (status: string) => status === "loading",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/features/shell/ui/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock("@/features/shell/ui/MobileTopNav", () => ({
  MobileTopNav: () => <div data-testid="mobile-top-nav" />,
}));

vi.mock("@/shared/lib/providers", () => ({
  LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => {
      const labels: Record<string, string> = {
        "auth.signIn": "Sign in",
        "locale.switchToVi": "Switch to Vietnamese",
        "theme.switchToDark": "Switch to dark theme",
      };
      return labels[key] ?? key;
    },
  }),
  useResolvedTheme: () => "light",
  useT: () => (key: string) => {
    const labels: Record<string, string> = {
      "auth.signIn": "Sign in",
      "locale.switchToVi": "Switch to Vietnamese",
      "theme.switchToDark": "Switch to dark theme",
    };
      return labels[key] ?? key;
  },
  useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
}));

describe("AppShell", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/");
    mocks.useAuthSession.mockReturnValue({ status: "guest" });
  });

  it("renders the guest home with a top navbar instead of a sidebar", () => {
    render(
      <AppShell>
        <div>Home content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Ownlish" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-top-nav")).not.toBeInTheDocument();
  });

  it("renders the guest navbar instead of a sidebar on protected routes during redirect", () => {
    mocks.usePathname.mockReturnValue("/tests");

    render(
      <AppShell>
        <div>Protected content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-top-nav")).not.toBeInTheDocument();
  });
});

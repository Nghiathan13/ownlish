import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuestTopNav } from "./GuestTopNav";

const mocks = vi.hoisted(() => ({
  setLocale: vi.fn(),
  setTheme: vi.fn(),
  useAuthSession: vi.fn(),
}));

vi.mock("@/entities/session", () => ({
  isLoadingStatus: (status: string) => status === "loading",
  useAuthSession: mocks.useAuthSession,
}));
vi.mock("@/shared/lib/providers", () => ({
  useLocale: () => ({ locale: "en", setLocale: mocks.setLocale, t: (key: string) => key }),
  useT: () => (key: string) => key,
}));
vi.mock("@/shared/lib/providers", () => ({
  useResolvedTheme: () => "dark",
  useTheme: () => ({ setTheme: mocks.setTheme }),
}));

describe("GuestTopNav", () => {
  beforeEach(() => {
    mocks.setLocale.mockReset();
    mocks.setTheme.mockReset();
    mocks.useAuthSession.mockReturnValue({ status: "guest" });
  });

  it("renders guest actions and changes locale and theme", () => {
    const scroller = document.createElement("div");
    document.body.append(scroller);
    const view = render(<GuestTopNav />, { container: scroller });

    fireEvent.click(screen.getByRole("button", { name: "locale.switchToVi" }));
    fireEvent.click(screen.getByRole("button", { name: "theme.switchToLight" }));
    expect(mocks.setLocale).toHaveBeenCalledWith("vi");
    expect(mocks.setTheme).toHaveBeenCalledWith("light");
    expect(screen.getByRole("link", { name: "auth.signIn" })).toHaveAttribute("href", "/login");

    scroller.scrollTop = 12;
    fireEvent.scroll(scroller);
    expect(view.container.querySelector("nav")).toHaveClass("top-2");
    view.unmount();
    scroller.remove();
  });

  it("hides the sign-in link while session bootstrap is loading", () => {
    mocks.useAuthSession.mockReturnValue({ status: "loading" });
    render(<GuestTopNav />);

    expect(screen.queryByRole("link", { name: "auth.signIn" })).not.toBeInTheDocument();
  });
});
